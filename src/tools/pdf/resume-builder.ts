// Resume Builder — lays out a real PDF resume with pdf-lib (no new
// dependency; reuses the same library the PDF manipulation tools use).

import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { sanitizeForFont } from "./pdf-font-utils";

export interface ResumeExperience {
  title: string;
  company: string;
  dates?: string;
  bullets?: string[];
}

export interface ResumeEducation {
  degree: string;
  school: string;
  dates?: string;
}

export interface ResumeInput {
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  experience?: ResumeExperience[];
  education?: ResumeEducation[];
  skills?: string[];
}

const MARGIN = 50;
const PAGE_SIZE: [number, number] = [612, 792];
const CONTENT_WIDTH = PAGE_SIZE[0] - MARGIN * 2;

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function generateResumePdf(input: ResumeInput): Promise<Uint8Array> {
  if (!input.name) throw new Error("name is required");

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);

  // Sanitize every free-form field up front — pdf-lib's StandardFonts only
  // support WinAnsi encoding; see pdf-font-utils.ts for why this matters (a
  // single unsupported character anywhere used to take down the whole
  // resume).
  const clean = (s: string) => sanitizeForFont(s, font);
  input.name = clean(input.name);
  if (input.title) input.title = clean(input.title);
  if (input.email) input.email = clean(input.email);
  if (input.phone) input.phone = clean(input.phone);
  if (input.location) input.location = clean(input.location);
  if (input.summary) input.summary = clean(input.summary);
  for (const job of input.experience ?? []) {
    job.title = clean(job.title);
    job.company = clean(job.company);
    if (job.dates) job.dates = clean(job.dates);
    if (job.bullets) job.bullets = job.bullets.map(clean);
  }
  for (const edu of input.education ?? []) {
    edu.degree = clean(edu.degree);
    edu.school = clean(edu.school);
    if (edu.dates) edu.dates = clean(edu.dates);
  }
  if (input.skills) input.skills = input.skills.map(clean);

  let page = doc.addPage(PAGE_SIZE);
  let y = PAGE_SIZE[1] - MARGIN;

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN) {
      page = doc.addPage(PAGE_SIZE);
      y = PAGE_SIZE[1] - MARGIN;
    }
  };

  const text = (str: string, x: number, size: number, f: PDFFont = font, color = rgb(0.15, 0.15, 0.15)) => {
    page.drawText(str, { x, y, size, font: f, color });
  };

  // Header
  text(input.name, MARGIN, 22, bold, rgb(0.1, 0.1, 0.1));
  y -= 26;
  if (input.title) { text(input.title, MARGIN, 12, italic, rgb(0.4, 0.4, 0.4)); y -= 18; }

  const contactLine = [input.email, input.phone, input.location].filter(Boolean).join("   ·   ");
  if (contactLine) { text(contactLine, MARGIN, 10, font, rgb(0.4, 0.4, 0.4)); y -= 24; }

  const sectionHeading = (label: string) => {
    ensureSpace(30);
    y -= 6;
    text(label.toUpperCase(), MARGIN, 11, bold, rgb(0.35, 0.15, 0.75));
    y -= 4;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_SIZE[0] - MARGIN, y }, thickness: 0.75, color: rgb(0.85, 0.85, 0.85) });
    y -= 16;
  };

  if (input.summary) {
    sectionHeading("Summary");
    for (const line of wrapText(input.summary, font, 10, CONTENT_WIDTH)) {
      ensureSpace(14);
      text(line, MARGIN, 10);
      y -= 14;
    }
  }

  if (input.experience?.length) {
    sectionHeading("Experience");
    for (const job of input.experience) {
      ensureSpace(34);
      text(job.title, MARGIN, 11, bold);
      if (job.dates) {
        const w = font.widthOfTextAtSize(job.dates, 10);
        text(job.dates, PAGE_SIZE[0] - MARGIN - w, 10, italic, rgb(0.5, 0.5, 0.5));
      }
      y -= 14;
      text(job.company, MARGIN, 10, italic, rgb(0.4, 0.4, 0.4));
      y -= 16;
      for (const bullet of job.bullets ?? []) {
        for (const line of wrapText(`•  ${bullet}`, font, 10, CONTENT_WIDTH - 10)) {
          ensureSpace(14);
          text(line, MARGIN + 10, 10);
          y -= 14;
        }
      }
      y -= 8;
    }
  }

  if (input.education?.length) {
    sectionHeading("Education");
    for (const edu of input.education) {
      ensureSpace(20);
      text(edu.degree, MARGIN, 11, bold);
      if (edu.dates) {
        const w = font.widthOfTextAtSize(edu.dates, 10);
        text(edu.dates, PAGE_SIZE[0] - MARGIN - w, 10, italic, rgb(0.5, 0.5, 0.5));
      }
      y -= 14;
      text(edu.school, MARGIN, 10, italic, rgb(0.4, 0.4, 0.4));
      y -= 18;
    }
  }

  if (input.skills?.length) {
    sectionHeading("Skills");
    for (const line of wrapText(input.skills.join("   ·   "), font, 10, CONTENT_WIDTH)) {
      ensureSpace(14);
      text(line, MARGIN, 10);
      y -= 14;
    }
  }

  return doc.save();
}
