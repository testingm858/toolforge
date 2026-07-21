// PDF Protect / Unlock — pdf-lib (used for the rest of pdf-tools.ts) has no
// encryption support at all, so these two use mupdf (Artifex's official WASM
// build of the real MuPDF C library) instead, which exposes the standard PDF
// security handler through free-form save option strings — the same syntax
// mutool's CLI accepts. Confirmed by smoke test: encrypting with
// "encrypt=aes-256,user-password=...,owner-password=...,permissions=-4"
// produces a PDF that genuinely requires the password to open (verified via
// needsPassword()/authenticatePassword() round-trip), and re-saving an
// authenticated document with "encrypt=none" strips it back out.
//
// permissions=-4: a 32-bit value where the two reserved spec bits (0,1) are
// 0 and every other bit is 1 — "allow everything" once the password is
// entered. There's no UI for restricting print/copy/edit in v1, only a
// require-a-password-to-open toggle.
//
// A comma anywhere in the password silently produces an unrecoverably
// broken PDF: mupdf still reports needsPassword() === true afterward, but
// authenticatePassword() then fails for EVERY string tried, including the
// exact original password — the file is permanently locked, not just
// mis-parsed. Confirmed this isn't our string-escaping being naive: passing
// the options as a plain object (bypassing any comma-separated-string
// parsing on our side entirely) hits the identical failure, so the bug is
// inside mupdf's own option handling. No other character (tested: quotes,
// backslash, unicode, null byte, every other ASCII punctuation mark)
// reproduces it. escapeOptionValue() below is a correctness guard against
// real, silent data loss, not defensive-programming theater.

import * as mupdf from "mupdf";

function escapeOptionValue(value: string): string {
  if (value.includes(",")) throw new Error("Password cannot contain a comma");
  return value;
}

// A PDF can be encrypted with only an owner password — no password is
// needed to open/read it (needsPassword() is false), but edit/print/copy
// permissions are restricted. This is what most "protect a PDF" tools
// produce when the user isn't prompted for an open password, and it's very
// often what people mean by "unlock this PDF": strip those restrictions,
// not necessarily remove an open-password prompt that was never there.
// Since we already have full read access to such a document with no
// authentication at all, we can re-save with encrypt=none directly.
function isEncrypted(doc: mupdf.PDFDocument): boolean {
  return !doc.getTrailer().get("Encrypt").isNull();
}

function openPdf(buffer: ArrayBuffer): mupdf.PDFDocument {
  let doc;
  try {
    doc = mupdf.Document.openDocument(Buffer.from(buffer), "application/pdf");
  } catch (err) {
    throw new Error(`Could not read this file as a PDF: ${(err as Error).message}`);
  }
  const pdf = doc.asPDF();
  if (!pdf) throw new Error("Could not read this file as a PDF");
  return pdf;
}

export async function protectPdf(buffer: ArrayBuffer, password: string): Promise<Uint8Array> {
  if (!password) throw new Error("A password is required");
  escapeOptionValue(password);

  const doc = openPdf(buffer);
  if (doc.needsPassword()) throw new Error("This PDF is already password-protected");

  const out = doc.saveToBuffer(
    `encrypt=aes-256,user-password=${password},owner-password=${password},permissions=-4`
  );
  return out.asUint8Array();
}

export async function unlockPdf(buffer: ArrayBuffer, password?: string): Promise<Uint8Array> {
  const doc = openPdf(buffer);
  if (!isEncrypted(doc)) throw new Error("This PDF isn't password-protected or restricted");

  if (doc.needsPassword()) {
    if (!password) throw new Error("This PDF requires a password to unlock");
    const result = doc.authenticatePassword(password);
    if (result === 0) throw new Error("Incorrect password");
  }
  // else: owner-password-only (permission-restricted but freely readable) —
  // already have full access, no authentication needed to strip it.

  const out = doc.saveToBuffer("encrypt=none");
  return out.asUint8Array();
}
