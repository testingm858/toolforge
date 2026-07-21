// Marker type for dispatch() handlers that need to return raw bytes (an
// image, mainly) instead of JSON — e.g. qr-generator or base64-to-image,
// which take text/JSON input but produce a downloadable file. route.ts
// checks for this shape after calling dispatch() and, when present, skips
// the usual {result, latencyMs} JSON wrapper in favor of a raw response.

export interface BinaryOutput {
  __binaryOutput: true;
  bytes: Uint8Array;
  contentType: string;
  filename: string;
}

export function binaryOutput(bytes: Uint8Array, contentType: string, filename: string): BinaryOutput {
  return { __binaryOutput: true, bytes, contentType, filename };
}

export function isBinaryOutput(value: unknown): value is BinaryOutput {
  return !!value && typeof value === "object" && (value as Record<string, unknown>).__binaryOutput === true;
}
