// PDF manipulation — built on pdf-lib (pure JS, already a project dependency).
//
// pdf-lib can rewrite PDF structure (pages, metadata, simple drawing) but
// cannot rasterize pages to images, extract/reconstruct text, OCR scanned
// text, decrypt/encrypt PDFs, or recompress embedded images. Those live
// elsewhere: pdf-to-jpg in pdf-to-image.ts (pdfjs-dist + @napi-rs/canvas),
// pdf-to-word in pdf-to-word.ts (pdfjs-dist text extraction + docx),
// pdf-protect/pdf-unlock in pdf-protect.ts (mupdf — pdf-lib has no
// encryption support at all), and pdf-ocr in pdf-ocr.ts (pdf-to-image.ts's
// rasterizer + tesseract.js).

import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import sharp from "sharp";
import { sanitizeForFont } from "./pdf-font-utils";
import { renderPdfPagesToJpg } from "./pdf-to-image";

function assertPageNumbers(nums: number[], total: number, label = "page") {
  if (!Array.isArray(nums) || nums.length === 0) throw new Error(`Provide at least one ${label} number`);
  for (const n of nums) {
    if (!Number.isInteger(n) || n < 1 || n > total) {
      throw new Error(`${label} ${n} is out of range — this PDF has ${total} pages`);
    }
  }
}

export async function mergePdfs(buffers: ArrayBuffer[]): Promise<Uint8Array> {
  if (buffers.length < 2) throw new Error("Provide at least 2 PDF files to merge");
  const merged = await PDFDocument.create();
  for (const buf of buffers) {
    const src = await PDFDocument.load(buf);
    const pages = await merged.copyPages(src, src.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }
  return merged.save();
}

export async function rotatePdf(buffer: ArrayBuffer, angle: number): Promise<Uint8Array> {
  const normalized = ((angle % 360) + 360) % 360;
  if (![0, 90, 180, 270].includes(normalized)) throw new Error("angle must be 0, 90, 180, or 270");
  const doc = await PDFDocument.load(buffer);
  doc.getPages().forEach((p) => p.setRotation(degrees((p.getRotation().angle + normalized) % 360)));
  return doc.save();
}

export async function addWatermark(buffer: ArrayBuffer, rawText: string, opacity = 0.25): Promise<Uint8Array> {
  if (!rawText) throw new Error("text is required");
  const doc = await PDFDocument.load(buffer);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  // pdf-lib's StandardFonts only support WinAnsi encoding — see
  // pdf-font-utils.ts. Without this, any non-WinAnsi character in the
  // watermark text (CJK, Arabic, emoji) throws and takes down the whole
  // document.
  const text = sanitizeForFont(rawText, font);
  doc.getPages().forEach((page) => {
    const { width, height } = page.getSize();
    const size = 48;
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: width / 2 - textWidth / 2,
      y: height / 2,
      size,
      font,
      color: rgb(0.5, 0.5, 0.5),
      opacity: Math.min(Math.max(opacity, 0.05), 1),
      rotate: degrees(45),
    });
  });
  return doc.save();
}

export async function addPageNumbers(
  buffer: ArrayBuffer,
  opts: { startAt?: number; position?: "bottom-center" | "bottom-left" | "bottom-right" } = {}
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(buffer);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const startAt = opts.startAt ?? 1;
  const position = opts.position ?? "bottom-center";
  doc.getPages().forEach((page, i) => {
    const { width } = page.getSize();
    const text = String(i + startAt);
    const textWidth = font.widthOfTextAtSize(text, 11);
    const x = position === "bottom-left" ? 36 : position === "bottom-right" ? width - 36 - textWidth : width / 2 - textWidth / 2;
    page.drawText(text, { x, y: 24, size: 11, font, color: rgb(0.2, 0.2, 0.2) });
  });
  return doc.save();
}

export async function removePages(buffer: ArrayBuffer, pageNumbers: number[]): Promise<Uint8Array> {
  const doc = await PDFDocument.load(buffer);
  const total = doc.getPageCount();
  assertPageNumbers(pageNumbers, total);
  if (pageNumbers.length >= total) throw new Error("Cannot remove every page from the document");
  const indices = Array.from(new Set(pageNumbers.map((n) => n - 1))).sort((a, b) => b - a);
  for (const idx of indices) doc.removePage(idx);
  return doc.save();
}

export async function extractPages(buffer: ArrayBuffer, pageNumbers: number[]): Promise<Uint8Array> {
  const src = await PDFDocument.load(buffer);
  const total = src.getPageCount();
  assertPageNumbers(pageNumbers, total);
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, pageNumbers.map((n) => n - 1));
  pages.forEach((p) => out.addPage(p));
  return out.save();
}

export async function reorderPages(buffer: ArrayBuffer, order: number[]): Promise<Uint8Array> {
  const src = await PDFDocument.load(buffer);
  const total = src.getPageCount();
  if (order.length !== total || new Set(order).size !== total) {
    throw new Error(`order must list all ${total} pages exactly once`);
  }
  assertPageNumbers(order, total);
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, order.map((n) => n - 1));
  pages.forEach((p) => out.addPage(p));
  return out.save();
}

export interface PdfMetadata {
  title: string | null;
  author: string | null;
  subject: string | null;
  keywords: string | null;
  creator: string | null;
  producer: string | null;
  creationDate: string | null;
  modificationDate: string | null;
  pageCount: number;
}

export async function readMetadata(buffer: ArrayBuffer): Promise<PdfMetadata> {
  const doc = await PDFDocument.load(buffer);
  return {
    title: doc.getTitle() ?? null,
    author: doc.getAuthor() ?? null,
    subject: doc.getSubject() ?? null,
    keywords: doc.getKeywords() ?? null,
    creator: doc.getCreator() ?? null,
    producer: doc.getProducer() ?? null,
    creationDate: doc.getCreationDate()?.toISOString() ?? null,
    modificationDate: doc.getModificationDate()?.toISOString() ?? null,
    pageCount: doc.getPageCount(),
  };
}

export async function writeMetadata(
  buffer: ArrayBuffer,
  meta: { title?: string; author?: string; subject?: string; keywords?: string }
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(buffer);
  if (meta.title !== undefined) doc.setTitle(meta.title);
  if (meta.author !== undefined) doc.setAuthor(meta.author);
  if (meta.subject !== undefined) doc.setSubject(meta.subject);
  if (meta.keywords !== undefined) doc.setKeywords(meta.keywords.split(",").map((k) => k.trim()).filter(Boolean));
  return doc.save();
}

// Maximum-strength compression: rasterizes every page to a small,
// aggressively-recompressed JPEG and rebuilds the PDF from those images —
// the same technique iLovePDF's "Extreme" compression level uses. This
// squeezes far more out of image-heavy PDFs than structural compaction
// alone (which can't touch embedded image data), at the cost of the page
// becoming a flat image: text is no longer selectable/searchable.
async function rasterizeAndRecompress(buffer: ArrayBuffer): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(buffer);
  const pageSizes = srcDoc.getPages().map((p) => p.getSize());
  const { images } = await renderPdfPagesToJpg(buffer, { scale: 1 }); // 72 DPI — as small as a rendered page gets while staying legible

  const outDoc = await PDFDocument.create();
  for (let i = 0; i < images.length; i++) {
    const recompressed = await sharp(images[i]).jpeg({ quality: 25, mozjpeg: true }).toBuffer();
    const img = await outDoc.embedJpg(recompressed);
    const size = pageSizes[i] ?? { width: img.width, height: img.height };
    const page = outDoc.addPage([size.width, size.height]);
    page.drawImage(img, { x: 0, y: 0, width: size.width, height: size.height });
  }
  return outDoc.save({ useObjectStreams: true });
}

export async function compressPdf(buffer: ArrayBuffer): Promise<{ bytes: Uint8Array; originalSize: number; newSize: number; note: string }> {
  const originalSize = buffer.byteLength;

  const structDoc = await PDFDocument.load(buffer);
  const structBytes = await structDoc.save({ useObjectStreams: true });

  // Rasterizing can fail for unusual PDFs (huge pages, exotic encodings) —
  // fall back to the structural-only result rather than erroring the whole
  // operation out over a "go as small as possible" best-effort step.
  let rasterBytes: Uint8Array | null = null;
  try {
    rasterBytes = await rasterizeAndRecompress(buffer);
  } catch {
    rasterBytes = null;
  }

  // Never return something bigger than simple structural compaction (or
  // than a PDF that was already efficiently encoded) — pick whichever
  // candidate actually came out smaller.
  const useRaster = rasterBytes !== null && rasterBytes.byteLength < structBytes.byteLength;
  const bytes = useRaster ? rasterBytes! : structBytes;

  return {
    bytes,
    originalSize,
    newSize: bytes.byteLength,
    note: useRaster
      ? "Maximum compression applied: pages were rasterized and re-encoded at low quality for the smallest possible file size. Text is no longer selectable/searchable."
      : "This PDF was already tightly encoded, or maximum-compression rasterizing would have produced a larger file - structural compaction (shared object streams) was used instead.",
  };
}

export async function imagesToPdf(buffers: ArrayBuffer[]): Promise<Uint8Array> {
  if (buffers.length === 0) throw new Error("Provide at least one image");
  const doc = await PDFDocument.create();
  for (const buf of buffers) {
    let img;
    try {
      img = await doc.embedJpg(buf);
    } catch {
      img = await doc.embedPng(buf);
    }
    const page = doc.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }
  return doc.save();
}

export async function stampSignature(buffer: ArrayBuffer, rawSignatureText: string, page?: number): Promise<Uint8Array> {
  if (!rawSignatureText) throw new Error("signatureText is required");
  const doc = await PDFDocument.load(buffer);
  const font = await doc.embedFont(StandardFonts.HelveticaOblique);
  // See addWatermark's comment above — same WinAnsi-only encoding limit.
  const signatureText = sanitizeForFont(rawSignatureText, font);
  const pages = doc.getPages();
  const pageIndex = (page ?? pages.length) - 1;
  if (pageIndex < 0 || pageIndex >= pages.length) throw new Error(`page must be between 1 and ${pages.length}`);
  const target = pages[pageIndex];
  const { width } = target.getSize();
  const size = 22;
  const textWidth = font.widthOfTextAtSize(signatureText, size);
  target.drawText(signatureText, { x: width - 48 - textWidth, y: 48, size, font, color: rgb(0.15, 0.15, 0.5) });
  target.drawLine({
    start: { x: width - 48 - textWidth, y: 44 },
    end: { x: width - 48, y: 44 },
    thickness: 1,
    color: rgb(0.15, 0.15, 0.5),
  });
  return doc.save();
}
