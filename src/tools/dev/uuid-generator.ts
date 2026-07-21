// UUID Generator — Web Crypto API

export function generateUUIDv4(): string {
  return crypto.randomUUID();
}

export function generateUUIDs(count: number): string[] {
  // Negative, NaN, or non-numeric count previously silently returned an
  // empty array (Array-like length coerces to 0) instead of a clear error.
  if (!Number.isInteger(count) || count < 1) throw new Error("count must be a positive integer");
  return Array.from({ length: Math.min(count, 1000) }, () => crypto.randomUUID());
}

export function isValidUUID(uuid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
}
