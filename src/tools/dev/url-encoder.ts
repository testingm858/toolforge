// URL Encoder / Decoder — pure JS

export function encodeUrl(input: string, full = false): string {
  return full ? encodeURIComponent(input) : encodeURI(input);
}

export function decodeUrl(input: string): { result: string; valid: boolean; error?: string } {
  try {
    const result = decodeURIComponent(input);
    return { result, valid: true };
  } catch {
    try {
      return { result: decodeURI(input), valid: true };
    } catch (err) {
      return { result: "", valid: false, error: (err as Error).message };
    }
  }
}

export function parseQueryString(qs: string): Record<string, string> {
  const params = new URLSearchParams(qs.startsWith("?") ? qs.slice(1) : qs);
  const result: Record<string, string> = {};
  params.forEach((value, key) => { result[key] = value; });
  return result;
}

export function buildQueryString(params: Record<string, string>): string {
  return new URLSearchParams(params).toString();
}
