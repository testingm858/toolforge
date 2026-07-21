// HTTP header / redirect checkers — these make an outbound request from OUR
// server to a user-supplied URL, so they're a classic SSRF vector (a user
// could otherwise point us at internal services or a cloud metadata
// endpoint). assertPublicUrl() resolves the hostname and rejects anything
// that isn't a public, routable address before we ever fetch it.

import dns from "node:dns/promises";
import net from "node:net";

// Exported for reuse by ip-lookup.ts, which needs the same private/reserved
// classification for a different reason: not SSRF prevention (we're not
// fetching a user-controlled URL), but because looking up a private IP's
// geolocation is meaningless and the lookup API returns a confusing
// all-null 200 response for one instead of an error.
export function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true; // link-local + cloud metadata (169.254.169.254)
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT
  return false;
}

export function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1") return true; // loopback
  if (lower.startsWith("fe80:")) return true; // link-local
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local
  if (lower.startsWith("::ffff:")) return isPrivateIPv4(lower.replace("::ffff:", ""));
  return false;
}

async function assertPublicUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http:// and https:// URLs are allowed");
  }

  // WHATWG URL always keeps IPv6 literals bracketed in .hostname (e.g.
  // "[::1]"), but net.isIP() and isPrivateIPv6() both expect the bare
  // address. Without stripping the brackets here, net.isIP() returns 0 for
  // every IPv6 URL, so the direct-IP branch below never runs for IPv6 at
  // all — confirmed http://[::1]/ falls through to the dns.lookup() branch
  // instead, which only caught it because this platform's resolver happens
  // to tolerate the bracketed string. That's incidental, not guaranteed.
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (hostname === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new Error("Requests to local/internal hostnames are not allowed");
  }

  if (net.isIP(hostname)) {
    if (net.isIP(hostname) === 4 ? isPrivateIPv4(hostname) : isPrivateIPv6(hostname)) {
      throw new Error("Requests to private/internal IP addresses are not allowed");
    }
    return url;
  }

  const records = await dns.lookup(hostname, { all: true });
  for (const rec of records) {
    const isPrivate = rec.family === 4 ? isPrivateIPv4(rec.address) : isPrivateIPv6(rec.address);
    if (isPrivate) throw new Error("This hostname resolves to a private/internal IP address and cannot be checked");
  }
  return url;
}

export async function checkHttpHeaders(rawUrl: string): Promise<{ url: string; status: number; headers: Record<string, string> }> {
  const url = await assertPublicUrl(rawUrl);
  const res = await fetch(url.toString(), { method: "GET", redirect: "manual", signal: AbortSignal.timeout(8000) });
  const headers: Record<string, string> = {};
  res.headers.forEach((value, key) => { headers[key] = value; });
  return { url: url.toString(), status: res.status, headers };
}

export async function checkRedirectChain(rawUrl: string): Promise<{ chain: { url: string; status: number }[]; final: string }> {
  let current = (await assertPublicUrl(rawUrl)).toString();
  const chain: { url: string; status: number }[] = [];
  const maxHops = 10;

  for (let i = 0; i < maxHops; i++) {
    const url = await assertPublicUrl(current);
    const res = await fetch(url.toString(), { method: "GET", redirect: "manual", signal: AbortSignal.timeout(8000) });
    chain.push({ url: url.toString(), status: res.status });

    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      current = new URL(location, url).toString();
      continue;
    }
    break;
  }

  return { chain, final: chain[chain.length - 1]?.url ?? current };
}
