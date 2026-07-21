// PDF OCR — rasterizes each page (reusing the same pdfjs-dist +
// @napi-rs/canvas pipeline as pdf-to-jpg) and runs it through tesseract.js
// (a pure WASM port of the real Tesseract OCR engine — no native binary).
// Tesseract's own PDF renderer, exposed via the `pdf: true` output format,
// produces a single-page PDF with the original page image as the visible
// layer and the recognized text stamped invisibly on top (PDF text render
// mode 3 — the same technique every "searchable PDF" OCR tool uses); those
// per-page PDFs are then stitched together with pdf-lib.
//
// Trained-data files (eng.traineddata.gz + 12 more, see
// SUPPORTED_OCR_LANGUAGES) are bundled in assets/tessdata rather than left
// on tesseract.js's default behavior, which is to silently fetch them from
// a CDN on first use and
// cache the decompressed copy in whatever process.cwd() happens to be — a
// hidden runtime network dependency that doesn't fit "ready to use" and
// could silently write into the wrong directory in a serverless/read-only
// deployment. cacheMethod "none" skips that caching layer entirely so every
// call reads directly from our bundled copy.
//
// One language per OCR run, not a combined multi-language pass — same
// scope Google Drive's and Adobe's basic OCR tools ship. Verified against
// real, correctly-rendered glyphs (not just that the language files exist)
// for a Latin-with-diacritics language (Spanish/French) and a CJK language
// (Japanese) — both recognized correctly, in both plain-text and the
// invisible PDF text layer.
//
// Arabic ("ara") is handled separately, in pdf-ocr-arabic.ts, instead of
// through this module's normal path: Tesseract's own `pdf: true` PDF writer
// doesn't apply RTL bidi reordering when placing the invisible text layer
// ("مرحبا بالعالم" recognizes correctly as plain text, but the same image's
// PDF output embeds "ملاعلاب ابحرم" — every word AND every character within
// each word reversed, a long-standing upstream Tesseract bug). See
// pdf-ocr-arabic.ts for the hand-built invisible-text-overlay fix.

import { createWorker } from "tesseract.js";
import path from "node:path";
import { PDFDocument as PDFLibDocument } from "pdf-lib";
import { renderPdfPagesToJpg } from "./pdf-to-image";
import { ocrArabicPdf } from "./pdf-ocr-arabic";

const TESSDATA_PATH = path.join(process.cwd(), "assets/tessdata");

export const SUPPORTED_OCR_LANGUAGES: { code: string; label: string }[] = [
  { code: "eng", label: "English" },
  { code: "spa", label: "Spanish" },
  { code: "fra", label: "French" },
  { code: "deu", label: "German" },
  { code: "ita", label: "Italian" },
  { code: "por", label: "Portuguese" },
  { code: "nld", label: "Dutch" },
  { code: "rus", label: "Russian" },
  { code: "chi_sim", label: "Chinese (Simplified)" },
  { code: "chi_tra", label: "Chinese (Traditional)" },
  { code: "jpn", label: "Japanese" },
  { code: "kor", label: "Korean" },
  { code: "hin", label: "Hindi" },
  { code: "ara", label: "Arabic" },
];

const SUPPORTED_CODES = new Set(SUPPORTED_OCR_LANGUAGES.map((l) => l.code));

export async function ocrPdf(buffer: ArrayBuffer, opts: { pages?: number[]; lang?: string } = {}): Promise<Uint8Array> {
  const lang = opts.lang ?? "eng";
  if (!SUPPORTED_CODES.has(lang)) {
    throw new Error(`Unsupported OCR language: "${lang}"`);
  }

  if (lang === "ara") {
    return ocrArabicPdf(buffer, { pages: opts.pages });
  }

  const { images } = await renderPdfPagesToJpg(buffer, { pages: opts.pages, scale: 3 });

  const worker = await createWorker(lang, 1, {
    langPath: TESSDATA_PATH,
    gzip: true,
    cacheMethod: "none",
  });

  try {
    const merged = await PDFLibDocument.create();
    for (const image of images) {
      const { data } = await worker.recognize(Buffer.from(image), {}, { pdf: true });
      if (!data.pdf) throw new Error("OCR did not produce output for one or more pages");
      const pagePdf = await PDFLibDocument.load(Buffer.from(data.pdf));
      const [copiedPage] = await merged.copyPages(pagePdf, [0]);
      merged.addPage(copiedPage);
    }
    return merged.save();
  } finally {
    await worker.terminate();
  }
}
