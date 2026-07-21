// Shared pdfjs-dist bootstrap for the "legacy" Node build. Both
// pdf-to-image.ts (rasterizing) and pdf-to-word.ts (text extraction) need
// this exact setup — kept in one place so the two bundler-path fixes below
// don't drift out of sync between the two call sites.

import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import path from "node:path";
import { pathToFileURL } from "node:url";

// pdf.js falls back to dynamically import()-ing a worker script when it
// can't spin up a real Worker thread (our case — this is a one-shot
// server-side operation). Its default guess for that script's location is a
// path relative to wherever its own bundled chunk ends up, which breaks
// under Next's bundling. Pointing it at the real file directly (a proper
// file:// URL — dynamic import(), unlike fs.readFile, handles these fine)
// sidesteps the guessing entirely.
pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(
  path.join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs")
).href;

// PDF.js needs its bundled standard font metrics on disk to correctly map
// glyphs to characters for the 14 base PDF fonts — without this, text
// extraction/rendering falls back to a generic substitute (visibly wrong
// kerning when rendering; potentially wrong character mapping when
// extracting text from fonts using non-standard encodings).
//
// This deliberately is NOT a file:// URL. pdf.js's own Node font loader
// does `fs.readFile(standardFontDataUrl + filename)` — fs.readFile only
// auto-parses actual URL *objects*, not "file://..." strings, so passing a
// URL string here makes it treat the whole thing as a literal (bogus, cwd-
// relative) path and fail with ENOENT. A plain filesystem path works
// correctly with that same string-concatenation logic.
// pdf.js validates this ends with "/" specifically (not path.sep) —
// on Windows that'd be "\", which it rejects outright.
export const STANDARD_FONTS_PATH = path.join(process.cwd(), "node_modules/pdfjs-dist/standard_fonts") + "/";

export { pdfjsLib };
