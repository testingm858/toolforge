// Base64 Encoder / Decoder — pure JS

export function encodeBase64(input: string): string {
  return Buffer.from(input, "utf-8").toString("base64");
}

export function decodeBase64(input: string): { result: string; valid: boolean; error?: string } {
  // Buffer.from(str, "base64") never throws — it silently drops any
  // character outside the base64 alphabet and decodes whatever's left, so
  // this always returned {valid: true} even for input that isn't base64 at
  // all (confirmed: a plain English sentence decoded to garbage bytes with
  // no error). Validate the format ourselves before decoding.
  const cleaned = input.replace(/\s+/g, "");
  if (!cleaned || !/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned) || cleaned.length % 4 !== 0) {
    return { result: "", valid: false, error: "Invalid Base64 string" };
  }
  try {
    const decoded = Buffer.from(cleaned, "base64").toString("utf-8");
    return { result: decoded, valid: true };
  } catch {
    return { result: "", valid: false, error: "Invalid Base64 string" };
  }
}

export function encodeBase64Url(input: string): string {
  return encodeBase64(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function isValidBase64(str: string): boolean {
  try {
    return btoa(atob(str)) === str;
  } catch {
    return false;
  }
}
