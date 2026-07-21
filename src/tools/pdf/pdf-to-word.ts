// PDF -> Word — extracts text via pdfjs-dist's getTextContent() (no OCR;
// scanned/image-only PDFs yield no text) and reconstructs paragraphs from
// raw glyph positions, then builds a .docx with the `docx` package.
//
// pdf.js text items carry no paragraph/line semantics of their own — just a
// flat list of positioned strings. Lines are grouped by shared baseline y,
// paragraphs are grouped by comparing the vertical gap between lines against
// the page's typical line spacing, and headings are guessed from lines whose
// glyph height is notably larger than the page's median. This is a
// best-effort reconstruction, not a page-accurate reproduction of the
// original layout.

import { pdfjsLib, STANDARD_FONTS_PATH } from "./pdfjs-setup";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

interface TextItemLike {
  str: string;
  transform: number[];
  width: number;
  height: number;
}

// pdf.js's real TextItem type carries several fields (dir, fontName, hasEOL)
// we don't use, so TextItemLike isn't structurally assignable to it — cast
// through unknown rather than widening TextItemLike to match exactly.
function filterTextItems(items: unknown[]): TextItemLike[] {
  return items.filter(
    (item) => typeof item === "object" && item !== null && "str" in item && "transform" in item
  ) as unknown as TextItemLike[];
}

interface LinePart {
  x: number;
  str: string;
  width: number;
  height: number;
}

// buildLines()/linesToParagraphs() assume one continuous flow of text
// top-to-bottom — for a genuine multi-column page that reads left column
// top-to-bottom, then right column top-to-bottom, treating everything as
// one flow means text items at the SAME y-coordinate but in DIFFERENT
// columns get sorted purely left-to-right and merged into one line.
// Confirmed: a real two-column layout ("Left column line one." / "Right
// column line one." side by side) comes out as "Left column line one.
// Right column line one. Left column line two. Right column line two...",
// interleaving the two columns line-by-line instead of reading either one
// in full — every line reads as a non-sequitur.
//
// Detects a single consistent vertical gutter (2-column layout only — 3+
// columns are rarer and adds real detection complexity for a smaller
// payoff) by looking for an unusually wide horizontal gap between text
// items on the same line, repeated at a consistent x-position across most
// multi-segment lines on the page. A one-off wide gap (e.g. a wide table
// cell) won't trigger this; only a gutter that shows up over and over at
// the same position will.
function detectColumnGutter(items: TextItemLike[]): number | null {
  const yGroups: TextItemLike[][] = [];
  for (const item of items) {
    if (!item.str.trim()) continue;
    const y = item.transform[5];
    let group = yGroups.find((g) => Math.abs(g[0].transform[5] - y) < 2);
    if (!group) { group = []; yGroups.push(group); }
    group.push(item);
  }

  const gutterCandidates: number[] = [];
  for (const group of yGroups) {
    if (group.length < 2) continue;
    const sorted = [...group].sort((a, b) => a.transform[4] - b.transform[4]);
    let maxGap = 0;
    let maxGapMid = 0;
    for (let i = 1; i < sorted.length; i++) {
      const prevEnd = sorted[i - 1].transform[4] + sorted[i - 1].width;
      const gap = sorted[i].transform[4] - prevEnd;
      if (gap > maxGap) {
        maxGap = gap;
        maxGapMid = (prevEnd + sorted[i].transform[4]) / 2;
      }
    }
    if (maxGap > 30) gutterCandidates.push(maxGapMid);
  }

  if (gutterCandidates.length < 3) return null;

  gutterCandidates.sort((a, b) => a - b);
  let bestCount = 0;
  let bestX = 0;
  for (const c of gutterCandidates) {
    const count = gutterCandidates.filter((g) => Math.abs(g - c) < 20).length;
    if (count > bestCount) { bestCount = count; bestX = c; }
  }

  return bestCount >= gutterCandidates.length * 0.6 ? bestX : null;
}

interface LineInfo {
  y: number;
  text: string;
  avgHeight: number;
}

function buildLines(items: TextItemLike[]): LineInfo[] {
  const lines: { y: number; parts: LinePart[] }[] = [];
  for (const item of items) {
    if (!item.str) continue;
    const x = item.transform[4];
    const y = item.transform[5];
    const height = item.height || Math.abs(item.transform[3]) || 10;
    let line = lines.find((l) => Math.abs(l.y - y) < 2);
    if (!line) {
      line = { y, parts: [] };
      lines.push(line);
    }
    line.parts.push({ x, str: item.str, width: item.width, height });
  }

  lines.sort((a, b) => b.y - a.y);

  return lines
    .map((line) => {
      line.parts.sort((a, b) => a.x - b.x);
      let text = "";
      let prevEnd: number | null = null;
      for (const part of line.parts) {
        if (prevEnd !== null) {
          const gap = part.x - prevEnd;
          if (gap > part.height * 0.25 && !text.endsWith(" ") && !part.str.startsWith(" ")) {
            text += " ";
          }
        }
        text += part.str;
        prevEnd = part.x + part.width;
      }
      const avgHeight = line.parts.reduce((s, p) => s + p.height, 0) / line.parts.length;
      return { y: line.y, text: text.replace(/\s+/g, " ").trim(), avgHeight };
    })
    .filter((l) => l.text.length > 0);
}

interface ParagraphInfo {
  text: string;
  heading: boolean;
}

function linesToParagraphs(lines: LineInfo[]): ParagraphInfo[] {
  if (lines.length === 0) return [];

  const heights = [...lines.map((l) => l.avgHeight)].sort((a, b) => a - b);
  const medianHeight = heights[Math.floor(heights.length / 2)] || 10;
  // Headings are by definition always larger than body text, never smaller
  // — so the smallest observed line height is a more reliable "this is
  // ordinary body text" reference than the median. On a short page with
  // few body lines relative to headings (a short memo: one title, one
  // subheading, two body lines), the median can land ON a heading's own
  // height rather than the body text's, misclassifying it as non-heading —
  // confirmed this exact failure mode on a 4-line test page, where a
  // 14pt heading among [20, 11, 14, 11] took the median (14) as its own
  // reference and silently merged into the following body paragraph.
  const minHeight = heights[0] || 10;

  // Baseline "same paragraph" line spacing is the *smallest* observed gap
  // (normal line-to-line spacing is tight and consistent), not the median —
  // the median gets pulled up by the very paragraph-break/heading gaps
  // we're trying to detect, which would otherwise mask real breaks whose
  // size happens to sit close to that inflated median.
  const gaps: number[] = [];
  for (let i = 1; i < lines.length; i++) gaps.push(lines[i - 1].y - lines[i].y);
  const baselineGap = gaps.length ? Math.min(...gaps) : medianHeight * 1.2;
  const gapThreshold = Math.max(baselineGap * 1.5, medianHeight * 0.3);

  const paragraphs: ParagraphInfo[] = [];
  let current = lines[0].text;
  let currentHeading = lines[0].avgHeight > minHeight * 1.2;

  for (let i = 1; i < lines.length; i++) {
    const gap = lines[i - 1].y - lines[i].y;
    const isHeading = lines[i].avgHeight > minHeight * 1.2;
    const isBreak = gap >= gapThreshold || isHeading !== currentHeading;
    if (isBreak) {
      paragraphs.push({ text: current, heading: currentHeading });
      current = lines[i].text;
      currentHeading = isHeading;
    } else {
      current += " " + lines[i].text;
    }
  }
  paragraphs.push({ text: current, heading: currentHeading });
  return paragraphs;
}

export async function convertPdfToDocx(buffer: ArrayBuffer): Promise<Uint8Array> {
  const data = new Uint8Array(buffer);
  let pdf;
  try {
    pdf = await pdfjsLib.getDocument({ data, standardFontDataUrl: STANDARD_FONTS_PATH }).promise;
  } catch (err) {
    if (err instanceof pdfjsLib.PasswordException) {
      throw new Error("This PDF is password-protected — use the PDF Unlock tool to remove the password first, then try again.");
    }
    throw new Error(`Could not read this file as a PDF: ${(err as Error).message}`);
  }

  const docxParagraphs: Paragraph[] = [];
  let anyText = false;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const items = filterTextItems(content.items);
    const gutterX = detectColumnGutter(items);
    const paragraphs = gutterX === null
      ? linesToParagraphs(buildLines(items))
      : [
          ...linesToParagraphs(buildLines(items.filter((it) => it.transform[4] < gutterX))),
          ...linesToParagraphs(buildLines(items.filter((it) => it.transform[4] >= gutterX))),
        ];

    paragraphs.forEach((p, i) => {
      if (!p.text) return;
      anyText = true;
      const pageBreakBefore = pageNum > 1 && i === 0;
      docxParagraphs.push(
        new Paragraph({
          heading: p.heading ? HeadingLevel.HEADING_2 : undefined,
          pageBreakBefore,
          spacing: { after: 160 },
          children: [new TextRun({ text: p.text, bold: p.heading })],
        })
      );
    });
  }

  if (!anyText) {
    throw new Error("No extractable text found in this PDF — it may be a scanned image with no text layer");
  }

  const doc = new Document({ sections: [{ children: docxParagraphs }] });
  return Packer.toBuffer(doc);
}
