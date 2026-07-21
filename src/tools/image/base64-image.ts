// Base64 <-> image conversions — no image processing library needed, just
// buffer encode/decode.

const MIME_EXT: Record<string, string> = {
  "image/png": "png", "image/jpeg": "jpeg", "image/gif": "gif",
  "image/webp": "webp", "image/svg+xml": "svg",
};

export function imageToBase64(buffer: ArrayBuffer, mimeType: string): { dataUrl: string; base64: string; sizeBytes: number } {
  const base64 = Buffer.from(buffer).toString("base64");
  return { dataUrl: `data:${mimeType};base64,${base64}`, base64, sizeBytes: buffer.byteLength };
}

// Magic-byte signatures for the formats this tool claims to support. Any
// string made only of base64-alphabet characters is *syntactically* valid
// base64 regardless of intent (e.g. a plain English sentence made of only
// letters, once whitespace is stripped, passes an alphabet+length check
// just as well as real image data) — decoding always "succeeds" with some
// bytes. Checking the decoded bytes' actual file signature is what
// distinguishes real image data from coincidental base64-shaped garbage.
function looksLikeImage(bytes: Buffer, mimeType: string): boolean {
  if (mimeType === "image/svg+xml") {
    const head = bytes.subarray(0, 200).toString("utf-8").trimStart();
    return head.startsWith("<");
  }
  if (bytes.length < 4) return false;
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return true; // PNG
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return true; // JPEG
  if (bytes.subarray(0, 3).toString("ascii") === "GIF") return true; // GIF
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return true;
  return false;
}

export function base64ToImage(input: string): { bytes: Buffer; mimeType: string; extension: string } {
  const trimmed = input.trim();
  const match = /^data:([^;]+);base64,([\s\S]+)$/.exec(trimmed);
  const mimeType = match ? match[1] : "image/png";
  const raw = (match ? match[2] : trimmed).replace(/\s+/g, "");

  if (!raw) throw new Error("Input is empty");
  // Buffer.from(str, "base64") never throws — it silently drops any
  // character outside the base64 alphabet and decodes whatever's left, so
  // this previously returned a "successful" but corrupt binary file for
  // any garbage input (confirmed with a plain-text string). Same fix as
  // base64.ts's decodeBase64: validate the format before decoding.
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(raw) || raw.length % 4 !== 0) {
    throw new Error("Invalid base64 input");
  }
  const bytes = Buffer.from(raw, "base64");
  if (bytes.length === 0) throw new Error("Decoded image is empty — check the base64 input");
  if (!looksLikeImage(bytes, mimeType)) {
    throw new Error("Decoded data doesn't look like a valid image — check the base64 input");
  }

  return { bytes, mimeType, extension: MIME_EXT[mimeType] ?? "png" };
}
