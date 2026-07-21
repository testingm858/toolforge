// Public webhook catcher — ANY /api/webhook-catch/:token
//
// Intentionally NOT gated by the tool orchestrator: the entire point is that
// an external service (Stripe, GitHub, a payment provider, whatever the
// user is testing) can hit this URL directly. Requests to an unknown or
// expired token get a 404 so this can't be used to probe arbitrary data.

import { NextRequest, NextResponse } from "next/server";
import { captureWebhookRequest } from "@/lib/redis";

const MAX_BODY_CHARS = 10_000;
// This route is intentionally open to the internet with no auth and no
// orchestrator rate-limiting (see comment above) — anyone can POST here,
// even against an unknown token. req.text() buffers the entire request
// body into memory before any truncation happens, so without a hard cap a
// single request with an arbitrarily large body (confirmed: 20MB took ~3s
// and was only truncated *after* being fully read) is an unauthenticated
// memory/CPU exhaustion vector. Read via a capped stream instead so we
// stop pulling bytes off the wire once we have enough.
const MAX_BODY_BYTES = 1_000_000;

async function readCappedBody(req: NextRequest): Promise<string> {
  if (!req.body) return "";
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.length;
      if (total > MAX_BODY_BYTES) {
        const keep = MAX_BODY_BYTES - (total - value.length);
        if (keep > 0) chunks.push(value.subarray(0, keep));
        await reader.cancel();
        break;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks).toString("utf-8");
}

async function handle(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Reject oversized requests before touching the body at all when the
  // client declares its size upfront (every real webhook sender — Stripe,
  // GitHub, curl with a known payload — sets this). The streaming cap in
  // readCappedBody is defense-in-depth for chunked senders with no
  // Content-Length, but cancelling a stream reader mid-flight doesn't
  // reliably stop an adversarial client from continuing to push bytes, so
  // this upfront check is the fix that actually matters in practice.
  const declaredLength = Number(req.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body too large" }, { status: 413 });
  }

  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => { headers[key] = value; });

  const query: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((value, key) => { query[key] = value; });

  let body = "";
  try {
    body = await readCappedBody(req);
    if (body.length > MAX_BODY_CHARS) body = body.slice(0, MAX_BODY_CHARS) + "\n...(truncated)";
  } catch {
    // no body — fine
  }

  const captured = await captureWebhookRequest(token, {
    method: req.method,
    headers,
    query,
    body,
    receivedAt: new Date().toISOString(),
  });

  if (!captured) {
    return NextResponse.json({ error: "Unknown or expired webhook session" }, { status: 404 });
  }
  return NextResponse.json({ received: true });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
