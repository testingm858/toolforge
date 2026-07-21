// Arabic PDF OCR — hand-built invisible text overlay, bypassing Tesseract's
// own `pdf: true` PDF writer entirely for this language.
//
// Background (see also the Arabic section of pdf-ocr.ts's doc comment):
// Tesseract's C++ PDF renderer has a long-standing, still-open upstream bug
// (tesseract-ocr/tesseract#238, #4428, #3472, among others going back to
// v3.05) where it doesn't apply RTL bidi reordering when writing the
// invisible searchable-text layer. Plain-text recognition is perfect
// ("مرحبا بالعالم" comes back exactly right), but the same image's `pdf:
// true` output embeds "ملاعلاب ابحرم" — every word AND every character
// within each word reversed. The page still looks correct (only the
// invisible layer is affected), so the file silently fails at the one thing
// "OCR a PDF" is for.
//
// This module rasterizes pages the same way pdf-to-image.ts does, but
// builds the invisible text layer itself with pdf-lib + @pdf-lib/fontkit +
// a bundled Arabic font (Noto Sans Arabic, SIL Open Font License — see
// assets/fonts/), using Tesseract's structured (non-PDF) recognition output
// for line text + bounding boxes instead of its PDF writer.
//
// Getting this right required two non-obvious fixes on top of the "obvious"
// approach (embed font, draw each line's text, done):
//
// 1. pdf-lib's font.embedFont(..., {subset: true}) dynamically tracks which
//    *shaped* glyphs get used and builds a correct ToUnicode map from them
//    (unlike the non-subset embedder, which only maps each codepoint's
//    *default* glyph — verified this mismatch is what corrupts non-subset
//    embedding). But fontkit's Arabic shaper also emits zero-width
//    joining/mark glyphs with an empty `codePoints` array (no source
//    Unicode text) as part of normal contextual shaping. Those get no valid
//    ToUnicode entry and show up as a stray U+FFFD on extraction. Fix:
//    encodeArabicLine() below replicates pdf-lib's own
//    CustomFontSubsetEmbedder.encodeText() but skips any glyph with zero
//    codePoints — confirmed via direct inspection that skipping them (and
//    only them) produces an exact round-trip match.
//
// 2. Text extraction's line/word grouping is sensitive to how the content
//    stream is structured, not just glyph position: drawing each word as
//    its own separate Tm+Tj (even correctly positioned, even in correct
//    reading order) gets each word extracted onto its OWN line instead of
//    joined by a space. Encoding a whole line as ONE continuous run and
//    drawing it with a single Tm+Tj fixes this — verified both effects
//    directly against mupdf's text extraction before writing this module.
//    fontkit's layout() already reorders a whole line's glyphs correctly
//    for visual (left-to-right pen movement) drawing, so no manual
//    word-reordering is needed once lines are drawn as single runs.

import { createWorker } from "tesseract.js";
import {
  PDFDocument, TextRenderingMode, PDFHexString, type PDFFont,
  beginText, endText, setFontAndSize, setTextRenderingMode, setTextMatrix, showText,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import path from "node:path";
import fs from "node:fs/promises";
import { renderPdfPagesToJpg } from "./pdf-to-image";

const TESSDATA_PATH = path.join(process.cwd(), "assets/tessdata");
const ARABIC_FONT_PATH = path.join(process.cwd(), "assets/fonts/NotoSansArabic-Regular.ttf");
const RENDER_SCALE = 3;

function toHex4(n: number): string {
  return n.toString(16).padStart(4, "0");
}

// PDFFont.embedder is a TypeScript-private field (plain, accessible JS
// property at runtime) holding the CustomFontSubsetEmbedder instance. No
// public pdf-lib API exposes glyph-level control, and reimplementing font
// embedding from scratch to get it would be a much larger undertaking than
// this narrow, well-understood reach into a pinned dependency's internals.
interface SubsetEmbedderInternals {
  font: { layout(text: string, features?: unknown): { glyphs: { id: number; codePoints: number[] }[] } };
  fontFeatures: unknown;
  subset: { includeGlyph(glyph: unknown): number };
  glyphs: unknown[];
  glyphIdMap: Map<number, number>;
  glyphCache: { invalidate(): void };
}

function encodeArabicLine(font: PDFFont, text: string): PDFHexString {
  const embedder = (font as unknown as { embedder: SubsetEmbedderInternals }).embedder;
  const { glyphs } = embedder.font.layout(text, embedder.fontFeatures);
  const hexCodes: string[] = [];
  for (const glyph of glyphs) {
    if (glyph.codePoints.length === 0) continue; // joining/mark artifact — no source text, would produce a stray U+FFFD
    const subsetGlyphId = embedder.subset.includeGlyph(glyph);
    embedder.glyphs[subsetGlyphId - 1] = glyph;
    embedder.glyphIdMap.set(glyph.id, subsetGlyphId);
    hexCodes.push(toHex4(subsetGlyphId));
  }
  embedder.glyphCache.invalidate();
  return PDFHexString.of(hexCodes.join(""));
}

export async function ocrArabicPdf(buffer: ArrayBuffer, opts: { pages?: number[] } = {}): Promise<Uint8Array> {
  const { images } = await renderPdfPagesToJpg(buffer, { pages: opts.pages, scale: RENDER_SCALE });

  const worker = await createWorker("ara", 1, {
    langPath: TESSDATA_PATH,
    gzip: true,
    cacheMethod: "none",
  });
  const fontBytes = await fs.readFile(ARABIC_FONT_PATH);

  try {
    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit);
    const font = await doc.embedFont(fontBytes, { subset: true });

    for (const image of images) {
      const { data } = await worker.recognize(Buffer.from(image), {}, { blocks: true });

      const jpgImage = await doc.embedJpg(image);
      const pageWidthPt = jpgImage.width / RENDER_SCALE;
      const pageHeightPt = jpgImage.height / RENDER_SCALE;
      const page = doc.addPage([pageWidthPt, pageHeightPt]);
      page.drawImage(jpgImage, { x: 0, y: 0, width: pageWidthPt, height: pageHeightPt });

      page.setFont(font);
      const fontKey = (page as unknown as { fontKey: unknown }).fontKey;

      for (const block of data.blocks ?? []) {
        for (const paragraph of block.paragraphs) {
          for (const line of paragraph.lines) {
            const text = line.text.trim();
            if (!text) continue;

            // Tesseract's bbox is in rasterized-image pixel space, top-left
            // origin; PDF points are bottom-left origin, so y flips.
            const x = line.bbox.x0 / RENDER_SCALE;
            const yTop = line.bbox.y0 / RENDER_SCALE;
            const yBottom = line.bbox.y1 / RENDER_SCALE;
            const fontSize = Math.max(4, (yBottom - yTop) * 0.85);
            const y = pageHeightPt - yBottom + fontSize * 0.15;

            page.pushOperators(
              beginText(),
              setFontAndSize(fontKey as never, fontSize),
              setTextRenderingMode(TextRenderingMode.Invisible),
              setTextMatrix(1, 0, 0, 1, x, y),
              showText(encodeArabicLine(font, text)),
              endText()
            );
          }
        }
      }
    }

    return doc.save();
  } finally {
    await worker.terminate();
  }
}
