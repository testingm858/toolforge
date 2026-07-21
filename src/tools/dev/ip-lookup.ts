// IP Address Lookup — freeipapi.com, a free, no-API-key geolocation service
// that explicitly allows commercial use (unlike ip-api.com, whose free tier
// is restricted to non-commercial use only). Redirects from freeipapi.com to
// free.freeipapi.com under the hood; Node's fetch() follows that
// automatically, no special handling needed.
//
// Private/reserved IPs (192.168.x.x, 10.x.x.x, 127.0.0.1, etc.) are rejected
// up front rather than sent to freeipapi.com: confirmed it returns a
// confusing HTTP 200 with every single field — including ipAddress itself —
// set to null for these, rather than an error. Reusing network-tools.ts's
// isPrivateIPv4/isPrivateIPv6 (built for SSRF prevention there; the
// classification logic is identical, we just need it for a different
// reason: geolocating a private address is meaningless).

import net from "node:net";
import { isPrivateIPv4, isPrivateIPv6 } from "@/tools/seo/network-tools";

export interface IpLookupResult {
  ip: string;
  country?: string;
  countryCode?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
  asn?: string;
  isProxy?: boolean;
}

export async function lookupIp(rawIp: string | undefined): Promise<IpLookupResult> {
  const ip = rawIp?.trim();
  if (ip) {
    const version = net.isIP(ip);
    if (version === 0) throw new Error("That doesn't look like a valid IPv4 or IPv6 address");
    const isPrivate = version === 4 ? isPrivateIPv4(ip) : isPrivateIPv6(ip);
    if (isPrivate) throw new Error("This is a private/reserved IP address and has no public geolocation");
  }

  const url = ip
    ? `https://freeipapi.com/api/json/${encodeURIComponent(ip)}`
    : "https://freeipapi.com/api/json/";

  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  } catch {
    throw new Error("Could not reach the IP lookup service. Please try again.");
  }
  if (!res.ok) throw new Error(`IP lookup failed (${res.status})`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error("The IP lookup service returned an unreadable response. Please try again.");
  }

  // freeipapi.com returns HTTP 200 with every field (including ipAddress
  // itself) set to null for addresses it can't geolocate — not just private
  // ranges (already rejected above), but also unallocated/reserved blocks
  // our pre-check doesn't cover. Catch that here instead of returning a
  // result that looks successful but carries no real data.
  if (!data.ipAddress) {
    throw new Error(ip ? "Could not find geolocation data for this IP address" : "Could not determine your IP address");
  }

  return {
    ip: data.ipAddress,
    country: data.countryName || undefined,
    countryCode: data.countryCode || undefined,
    city: data.cityName || undefined,
    region: data.regionName || undefined,
    latitude: typeof data.latitude === "number" ? data.latitude : undefined,
    longitude: typeof data.longitude === "number" ? data.longitude : undefined,
    timezone: data.timeZones?.[0] || undefined,
    isp: data.asnOrganization || undefined,
    asn: data.asn || undefined,
    isProxy: typeof data.isProxy === "boolean" ? data.isProxy : undefined,
  };
}
