// PDF -> JPG — renders PDF pages to raster images via pdfjs-dist (Mozilla's
// PDF.js, running in its Node/"legacy" build — no browser DOM involved) onto
// an @napi-rs/canvas surface (Rust-based, ships prebuilt binaries like sharp
// — deliberately not node-canvas, which needs a native build toolchain).

import { createCanvas } from "@napi-rs/canvas";
import { pdfjsLib, STANDARD_FONTS_PATH } from "./pdfjs-setup";

function assertPageNumbers(nums: number[], total: number) {
  for (const n of nums) {
    if (!Number.isInteger(n) || n < 1 || n > total) {
      throw new Error(`Page ${n} is out of range — this PDF has ${total} pages`);
    }
  }
}

// The PDF spec's own max page dimension (14400pt/200in per side) at our
// fixed scale=2 works out to a 28800x28800px canvas — confirmed
// @napi-rs/canvas's Skia backend refuses to allocate that ("Create skia
// surface failed", with no dimensions or explanation) and the failure
// propagated to users as-is. Rather than depend on exactly where that
// native library's undocumented, platform/version-dependent limit sits,
// cap proactively well below it (120MP comfortably covers real large-format
// docs — e.g. a 36x48in poster at scale=2 is only ~36MP) and fail with a
// clear message before ever attempting the allocation.
const MAX_OUTPUT_PIXELS = 120_000_000;

export async function renderPdfPagesToJpg(
  buffer: ArrayBuffer,
  opts: { pages?: number[]; scale?: number } = {}
): Promise<{ images: Buffer[]; pageNumbers: number[] }> {
  const data = new Uint8Array(buffer);
  let pdf;
  try {
    pdf = await pdfjsLib.getDocument({
      data,
      standardFontDataUrl: STANDARD_FONTS_PATH,
      disableFontFace: true,
    }).promise;
  } catch (err) {
    if (err instanceof pdfjsLib.PasswordException) {
      throw new Error("This PDF is password-protected — use the PDF Unlock tool to remove the password first, then try again.");
    }
    throw new Error(`Could not read this file as a PDF: ${(err as Error).message}`);
  }

  const pageNumbers = opts.pages && opts.pages.length > 0
    ? opts.pages
    : Array.from({ length: pdf.numPages }, (_, i) => i + 1);
  assertPageNumbers(pageNumbers, pdf.numPages);

  const scale = opts.scale ?? 2; // ~144 DPI (pdf.js base is 72 DPI)
  const images: Buffer[] = [];
  for (const pageNum of pageNumbers) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const width = Math.ceil(viewport.width);
    const height = Math.ceil(viewport.height);
    if (width * height > MAX_OUTPUT_PIXELS) {
      throw new Error(`Page ${pageNum} is too large to render (${width}x${height}px at this scale) — try a smaller page range`);
    }

    let canvas;
    try {
      canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");
      // pdf.js's render() expects a DOM CanvasRenderingContext2D/HTMLCanvasElement;
      // @napi-rs/canvas's types are structurally close but not identical (it's a
      // Rust-backed canvas, not a real DOM one) — this cast is the standard
      // bridge used across the Node + pdf.js + non-browser-canvas ecosystem.
      await page.render({
        canvasContext: ctx as unknown as CanvasRenderingContext2D,
        viewport,
        canvas: canvas as unknown as HTMLCanvasElement,
      }).promise;
    } catch (err) {
      throw new Error(`Could not render page ${pageNum}: ${(err as Error).message}`);
    }
    images.push(canvas.toBuffer("image/jpeg", 90));
  }

  return { images, pageNumbers };
}
