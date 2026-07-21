// JWT Encoder — HS256 via Web Crypto, no deps.

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return Buffer.from(binary, "binary").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function encodeJsonPart(obj: Record<string, unknown>): string {
  return base64UrlEncode(new TextEncoder().encode(JSON.stringify(obj)));
}

export async function encodeJwt(
  payload: Record<string, unknown>,
  secret: string,
  expiresInSeconds?: number
): Promise<{ token: string; header: Record<string, unknown>; payload: Record<string, unknown> }> {
  if (!secret) throw new Error("secret is required");
  if (!payload || typeof payload !== "object") throw new Error("payload must be a JSON object");

  const header = { alg: "HS256", typ: "JWT" };
  const fullPayload: Record<string, unknown> = { ...payload, iat: Math.floor(Date.now() / 1000) };
  if (expiresInSeconds) fullPayload.exp = Math.floor(Date.now() / 1000) + expiresInSeconds;

  const headerB64 = encodeJsonPart(header);
  const payloadB64 = encodeJsonPart(fullPayload);
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput));
  const signatureB64 = base64UrlEncode(new Uint8Array(signature));

  return { token: `${signingInput}.${signatureB64}`, header, payload: fullPayload };
}
