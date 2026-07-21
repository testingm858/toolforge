// Shared by word-to-pdf.ts, invoice-generator.ts, resume-builder.ts, and
// pdf-tools.ts (addWatermark/stampSignature) — every pdf-lib text-layout tool
// that embeds a StandardFonts font and draws free-form user-provided text
// with it.
//
// pdf-lib's StandardFonts only support WinAnsi encoding — no CJK, Arabic,
// most Cyrillic, or emoji. Confirmed: a single unsupported character
// anywhere in the input (a name, address, note, resume bullet — anything
// not hard-coded by us) throws and takes down the ENTIRE document,
// including content that has nothing to do with the offending character.
// Rather than require every field to be 100% WinAnsi-clean,
// widthOfTextAtSize() doubles as a free encodability probe — replace only
// the specific characters that don't fit, not the whole document.

import type { PDFFont } from "pdf-lib";

export function sanitizeForFont(text: string, font: PDFFont): string {
  try {
    font.widthOfTextAtSize(text, 10);
    return text;
  } catch {
    let out = "";
    for (const ch of text) {
      try {
        font.widthOfTextAtSize(ch, 10);
        out += ch;
      } catch {
        out += "?";
      }
    }
    return out;
  }
}
