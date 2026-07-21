// Builds "<original-base>_<operation>.<ext>" download names for file tools,
// and a Content-Disposition value that survives real-world filenames.
//
// Content-Disposition's basic filename= parameter must be a Latin-1/ASCII
// ByteString — any character outside that range throws when the header is
// constructed (this is exactly what crashed pdf-compress's X-Note header
// on an em dash). User-uploaded filenames routinely contain accents, CJK,
// emoji, or em dashes, so the basic param gets an ASCII-sanitized fallback
// while the RFC 5987 filename*=UTF-8''... extended parameter (always
// percent-encoded, so always ASCII-safe to embed) carries the real name for
// the vast majority of browsers that support it.

const RESERVED_CHARS = /[\\/:*?"<>|\x00-\x1f]/g;

export function stripExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx > 0 ? filename.slice(0, idx) : filename;
}

export function buildDownloadName(originalName: string | undefined, suffix: string, ext: string): string {
  const base = originalName ? stripExtension(originalName) : "file";
  const cleaned = base.replace(RESERVED_CHARS, "-").trim().slice(0, 150) || "file";
  return `${cleaned}_${suffix}.${ext}`;
}

export function contentDispositionValue(filename: string): string {
  const asciiSafe = filename.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "'");
  const utf8Encoded = encodeURIComponent(filename);
  return `attachment; filename="${asciiSafe}"; filename*=UTF-8''${utf8Encoded}`;
}

// Every other HTTP header value has the same Latin-1/ByteString constraint
// as Content-Disposition's basic param, but with no RFC 5987 extended form
// to fall back on — this has already taken down a response twice (an em
// dash in a free-text "note" header, twice, in two different strings).
// Applied centrally to every extraHeaders value rather than trusting each
// call site to remember to avoid non-ASCII characters.
export function sanitizeHeaderValue(value: string): string {
  return value.replace(/[^\x20-\x7e]/g, "?");
}

export function sanitizeHeaders(headers: Record<string, string> | undefined): Record<string, string> | undefined {
  if (!headers) return headers;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) out[key] = sanitizeHeaderValue(value);
  return out;
}
