// JWT Decoder — pure JS, no deps

export interface JwtParts {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  isExpired: boolean;
  expiresAt?: Date;
  issuedAt?: Date;
}

export function decodeJwt(token: string): { result?: JwtParts; valid: boolean; error?: string } {
  try {
    const parts = token.trim().split(".");
    if (parts.length !== 3) throw new Error("JWT must have 3 parts separated by dots");

    const decode = (part: string) => {
      const padded = part.replace(/-/g, "+").replace(/_/g, "/").padEnd(
        part.length + ((4 - (part.length % 4)) % 4), "="
      );
      return JSON.parse(Buffer.from(padded, "base64").toString("utf-8"));
    };

    const header = decode(parts[0]);
    const payload = decode(parts[1]);
    const signature = parts[2];

    const now = Math.floor(Date.now() / 1000);
    const isExpired = payload.exp ? (payload.exp as number) < now : false;
    const expiresAt = payload.exp ? new Date((payload.exp as number) * 1000) : undefined;
    const issuedAt = payload.iat ? new Date((payload.iat as number) * 1000) : undefined;

    return { result: { header, payload, signature, isExpired, expiresAt, issuedAt }, valid: true };
  } catch (err) {
    return { valid: false, error: (err as Error).message };
  }
}
