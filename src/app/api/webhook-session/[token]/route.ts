// GET /api/webhook-session/:token — polled by the webhook-tester UI to
// fetch captured requests. Deliberately NOT routed through the tool
// orchestrator: polling isn't "using a tool" in the metered sense, it's
// checking a mailbox, and gating it at 10 calls/day would make live polling
// unusable. The session token itself (a UUID minted by the orchestrator-
// gated create step) is the only access control here.

import { NextResponse } from "next/server";
import { getWebhookRequests } from "@/lib/redis";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const requests = await getWebhookRequests(token);
  if (requests === null) {
    return NextResponse.json({ error: "Unknown or expired webhook session" }, { status: 404 });
  }
  return NextResponse.json({ requests });
}
