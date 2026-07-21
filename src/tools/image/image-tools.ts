// Image manipulation — built on sharp (native, but a standard, well-vetted
// dependency with prebuilt binaries for all common platforms).

import sharp from "sharp";

export type ImageFormat = "jpeg" | "png" | "webp" | "avif";

const FORMAT_CONTENT_TYPE: Record<ImageFormat, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

export function contentTypeForFormat(format: ImageFormat): string {
  return FORMAT_CONTENT_TYPE[format];
}

function assertFormat(format: string): asserts format is ImageFormat {
  if (!(format in FORMAT_CONTENT_TYPE)) {
    throw new Error(`format must be one of: ${Object.keys(FORMAT_CONTENT_TYPE).join(", ")}`);
  }
}

// Sharp only caps *input* pixel count by default (decompression-bomb
// protection) — nothing stops a caller from requesting an arbitrarily large
// *output* size from a tiny source image (e.g. upscale a 10x10 PNG to
// 50000x50000), which allocates gigabytes of raw pixel data server-side.
// Confirmed: a 10000x10000 output takes well under a second, so this cap is
// generous for real use while keeping worst-case memory bounded.
const MAX_DIMENSION = 10000;

function assertDimension(label: string, value: number) {
  if (value > MAX_DIMENSION) throw new Error(`${label} must be ${MAX_DIMENSION}px or smaller`);
}

// Encoder options that push each format as hard as it goes at the given
// quality — mozjpeg's encoder beats libjpeg at the same quality number,
// "effort" trades CPU time for a smaller file at no quality cost, and PNG's
// palette mode (indexed color) is the single biggest lever available for
// photographic PNGs, similar to what pngquant does.
function maxCompressionOptions(format: ImageFormat, quality: number) {
  switch (format) {
    case "jpeg": return { quality, mozjpeg: true };
    case "webp": return { quality, effort: 6 };
    case "png": return { quality, effort: 10, compressionLevel: 9, palette: true };
    default: return { quality };
  }
}

export async function compressImage(buffer: ArrayBuffer, quality = 40): Promise<{ bytes: Buffer; format: ImageFormat; originalSize: number; newSize: number }> {
  if (!Number.isFinite(quality) || quality < 1 || quality > 100) throw new Error("quality must be between 1 and 100");
  const img = sharp(Buffer.from(buffer));
  const meta = await img.metadata();
  const format: ImageFormat = meta.format === "png" ? "png" : meta.format === "webp" ? "webp" : "jpeg";
  const bytes = await img.toFormat(format, maxCompressionOptions(format, quality)).toBuffer();
  return { bytes, format, originalSize: buffer.byteLength, newSize: bytes.byteLength };
}

function normalizeFormat(format?: string): ImageFormat {
  return format === "jpg" ? "jpeg" : (format as ImageFormat) in FORMAT_CONTENT_TYPE ? (format as ImageFormat) : "png";
}

export async function resizeImage(
  buffer: ArrayBuffer,
  opts: { width?: number; height?: number; fit?: "cover" | "contain" | "fill" | "inside" | "outside" }
): Promise<{ bytes: Buffer; format: ImageFormat }> {
  if (!opts.width && !opts.height) throw new Error("Provide at least width or height");
  if (opts.width !== undefined) assertDimension("width", opts.width);
  if (opts.height !== undefined) assertDimension("height", opts.height);
  const meta = await sharp(Buffer.from(buffer)).metadata();
  const format = normalizeFormat(meta.format);
  const bytes = await sharp(Buffer.from(buffer))
    .resize({ width: opts.width, height: opts.height, fit: opts.fit ?? "cover" })
    .toFormat(format)
    .toBuffer();
  return { bytes, format };
}

export async function cropImage(
  buffer: ArrayBuffer,
  opts: { left: number; top: number; width: number; height: number }
): Promise<{ bytes: Buffer; format: ImageFormat }> {
  for (const [key, val] of Object.entries(opts)) {
    if (!Number.isFinite(val) || val < 0) throw new Error(`${key} must be a non-negative number`);
  }
  // width/height of 0 pass the non-negative check above but produce a
  // cryptic native libvips error ("extract_area: parameter width not set")
  // instead of a clear message — reject them up front.
  if (opts.width === 0 || opts.height === 0) throw new Error("width and height must be greater than 0");
  const meta = await sharp(Buffer.from(buffer)).metadata();
  const format = normalizeFormat(meta.format);
  const bytes = await sharp(Buffer.from(buffer))
    .extract({ left: opts.left, top: opts.top, width: opts.width, height: opts.height })
    .toFormat(format)
    .toBuffer();
  return { bytes, format };
}

export async function rotateImage(buffer: ArrayBuffer, angle: number): Promise<{ bytes: Buffer; format: ImageFormat }> {
  if (!Number.isFinite(angle)) throw new Error("angle must be a number");
  const meta = await sharp(Buffer.from(buffer)).metadata();
  const format = normalizeFormat(meta.format);
  const bytes = await sharp(Buffer.from(buffer)).rotate(angle).toFormat(format).toBuffer();
  return { bytes, format };
}

export async function convertImage(buffer: ArrayBuffer, format: string): Promise<Buffer> {
  assertFormat(format);
  return sharp(Buffer.from(buffer)).toFormat(format).toBuffer();
}

export async function svgToRaster(buffer: ArrayBuffer, format: string, width?: number): Promise<Buffer> {
  assertFormat(format);
  if (width !== undefined) assertDimension("width", width);
  let pipeline = sharp(Buffer.from(buffer), { density: 300 });
  if (width) pipeline = pipeline.resize({ width });
  return pipeline.toFormat(format).toBuffer();
}

export interface ImageMetadata {
  format?: string;
  width?: number;
  height?: number;
  space?: string;
  channels?: number;
  hasAlpha?: boolean;
  orientation?: number;
  density?: number;
  sizeBytes: number;
}

export async function getImageMetadata(buffer: ArrayBuffer): Promise<ImageMetadata> {
  const meta = await sharp(Buffer.from(buffer)).metadata();
  return {
    format: meta.format,
    width: meta.width,
    height: meta.height,
    space: meta.space,
    channels: meta.channels,
    hasAlpha: meta.hasAlpha,
    orientation: meta.orientation,
    density: meta.density,
    sizeBytes: buffer.byteLength,
  };
}

export async function stripImageMetadata(buffer: ArrayBuffer): Promise<{ bytes: Buffer; format: ImageFormat }> {
  const meta = await sharp(Buffer.from(buffer)).metadata();
  const format = normalizeFormat(meta.format);
  // Re-encoding without .withMetadata() drops EXIF/GPS/ICC by default.
  const bytes = await sharp(Buffer.from(buffer)).toFormat(format).toBuffer();
  return { bytes, format };
}

export async function pickColorAtPixel(buffer: ArrayBuffer, x: number, y: number): Promise<{ r: number; g: number; b: number; x: number; y: number }> {
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0) throw new Error("x and y must be non-negative integers");
  const img = sharp(Buffer.from(buffer)).ensureAlpha();
  const meta = await img.metadata();
  if (!meta.width || !meta.height) throw new Error("Could not read image dimensions");
  if (x >= meta.width || y >= meta.height) throw new Error(`(${x},${y}) is outside the image bounds (${meta.width}x${meta.height})`);

  const { data } = await img.raw().toBuffer({ resolveWithObject: true });
  const channels = 4; // ensureAlpha() guarantees RGBA
  const idx = (y * meta.width + x) * channels;
  return { r: data[idx], g: data[idx + 1], b: data[idx + 2], x, y };
}
