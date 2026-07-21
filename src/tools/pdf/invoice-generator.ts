// Invoice Generator — lays out a real PDF invoice with pdf-lib (no new
// dependency; reuses the same library the PDF manipulation tools use).

import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { sanitizeForFont } from "./pdf-font-utils";

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceInput {
  invoiceNumber?: string;
  date?: string;
  dueDate?: string;
  from: { name: string; address?: string; email?: string };
  to: { name: string; address?: string; email?: string };
  items: InvoiceItem[];
  taxRatePct?: number;
  currency?: string;
  notes?: string;
}

const MARGIN = 50;
const PAGE_SIZE: [number, number] = [612, 792]; // US Letter

function money(n: number, currency: string): string {
  return `${currency}${n.toFixed(2)}`;
}

export async function generateInvoicePdf(input: InvoiceInput): Promise<Uint8Array> {
  if (!input.from?.name) throw new Error("from.name is required");
  if (!input.to?.name) throw new Error("to.name is required");
  if (!Array.isArray(input.items) || input.items.length === 0) throw new Error("items must be a non-empty array of { description, quantity, unitPrice }");
  for (const item of input.items) {
    if (!item.description) throw new Error("Every item needs a description");
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) throw new Error(`Invalid quantity for "${item.description}"`);
    if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) throw new Error(`Invalid unitPrice for "${item.description}"`);
  }

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Sanitize every free-form field up front, in one place, rather than at
  // each of the many drawText() call sites below — pdf-lib's StandardFonts
  // only support WinAnsi encoding; see pdf-font-utils.ts for why this
  // matters (a single unsupported character anywhere used to take down the
  // entire invoice).
  const clean = (s: string) => sanitizeForFont(s, font);
  input.from.name = clean(input.from.name);
  if (input.from.address) input.from.address = clean(input.from.address);
  if (input.from.email) input.from.email = clean(input.from.email);
  input.to.name = clean(input.to.name);
  if (input.to.address) input.to.address = clean(input.to.address);
  if (input.to.email) input.to.email = clean(input.to.email);
  for (const item of input.items) item.description = clean(item.description);
  if (input.notes) input.notes = clean(input.notes);
  if (input.dueDate) input.dueDate = clean(input.dueDate);

  const currency = clean(input.currency ?? "$");
  const date = clean(input.date ?? new Date().toISOString().split("T")[0]);
  const invoiceNumber = clean(input.invoiceNumber ?? `INV-${Date.now().toString().slice(-6)}`);
  let page = doc.addPage(PAGE_SIZE);
  let y = PAGE_SIZE[1] - MARGIN;

  const draw = (text: string, x: number, size: number, f: PDFFont = font, color = rgb(0.1, 0.1, 0.1)) => {
    page.drawText(text, { x, y, size, font: f, color });
  };

  // Header
  draw("INVOICE", MARGIN, 26, bold, rgb(0.35, 0.15, 0.75));
  draw(invoiceNumber, PAGE_SIZE[0] - MARGIN - bold.widthOfTextAtSize(invoiceNumber, 12), 12, bold);
  y -= 20;
  draw(`Date: ${date}`, PAGE_SIZE[0] - MARGIN - font.widthOfTextAtSize(`Date: ${date}`, 10), 10);
  if (input.dueDate) {
    y -= 14;
    draw(`Due: ${input.dueDate}`, PAGE_SIZE[0] - MARGIN - font.widthOfTextAtSize(`Due: ${input.dueDate}`, 10), 10);
  }
  y -= 40;

  // From / To
  draw("From", MARGIN, 10, bold, rgb(0.5, 0.5, 0.5));
  draw("Bill To", MARGIN + 280, 10, bold, rgb(0.5, 0.5, 0.5));
  y -= 16;
  draw(input.from.name, MARGIN, 12, bold);
  draw(input.to.name, MARGIN + 280, 12, bold);
  y -= 16;
  for (const line of [input.from.address, input.from.email].filter(Boolean) as string[]) {
    draw(line, MARGIN, 10);
    y -= 14;
  }
  const toStartY = y + 14 * ([input.from.address, input.from.email].filter(Boolean).length);
  let toY = toStartY;
  for (const line of [input.to.address, input.to.email].filter(Boolean) as string[]) {
    page.drawText(line, { x: MARGIN + 280, y: toY, size: 10, font, color: rgb(0.1, 0.1, 0.1) });
    toY -= 14;
  }
  y = Math.min(y, toY) - 30;

  // Table header
  const colX = { desc: MARGIN, qty: MARGIN + 300, price: MARGIN + 370, total: MARGIN + 460 };
  page.drawRectangle({ x: MARGIN, y: y - 4, width: PAGE_SIZE[0] - MARGIN * 2, height: 22, color: rgb(0.96, 0.95, 0.99) });
  draw("Description", colX.desc + 6, 10, bold);
  draw("Qty", colX.qty, 10, bold);
  draw("Unit Price", colX.price, 10, bold);
  draw("Total", colX.total, 10, bold);
  y -= 26;

  let subtotal = 0;
  for (const item of input.items) {
    if (y < MARGIN + 120) {
      page = doc.addPage(PAGE_SIZE);
      y = PAGE_SIZE[1] - MARGIN;
    }
    const lineTotal = item.quantity * item.unitPrice;
    subtotal += lineTotal;
    page.drawText(item.description, { x: colX.desc + 6, y, size: 10, font, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(String(item.quantity), { x: colX.qty, y, size: 10, font });
    page.drawText(money(item.unitPrice, currency), { x: colX.price, y, size: 10, font });
    page.drawText(money(lineTotal, currency), { x: colX.total, y, size: 10, font });
    y -= 20;
  }

  y -= 10;
  page.drawLine({ start: { x: MARGIN + 300, y }, end: { x: PAGE_SIZE[0] - MARGIN, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) });
  y -= 18;

  const taxRate = input.taxRatePct ?? 0;
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  const totalsLine = (label: string, value: string, big = false) => {
    page.drawText(label, { x: colX.price, y, size: big ? 12 : 10, font: big ? bold : font });
    page.drawText(value, { x: colX.total, y, size: big ? 12 : 10, font: big ? bold : font });
    y -= big ? 20 : 16;
  };
  totalsLine("Subtotal", money(subtotal, currency));
  if (taxRate > 0) totalsLine(`Tax (${taxRate}%)`, money(tax, currency));
  totalsLine("Total", money(total, currency), true);

  if (input.notes) {
    y -= 20;
    draw("Notes", MARGIN, 10, bold, rgb(0.5, 0.5, 0.5));
    y -= 14;
    draw(input.notes, MARGIN, 10);
  }

  return doc.save();
}
