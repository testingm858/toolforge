// Word to HTML — converts a .docx file to clean HTML via mammoth (a
// well-established pure-JS docx parser; .doc/legacy binary format isn't
// supported, only the modern .docx zip+XML format).

import mammoth from "mammoth";

// mammoth carries a docx hyperlink's target straight through into the
// output HTML's href attribute, unescaped beyond normal HTML-attribute
// encoding — a docx (e.g. one received from someone else and converted
// here) can embed a "javascript:" link that survives into the HTML this
// tool hands back. Since the point of this tool is producing HTML the user
// pastes onto their own site, an unreviewed paste would carry that live
// link with it. Allowlist safe schemes rather than blocklist dangerous
// ones — more robust against whitespace/case tricks in the scheme name.
const SAFE_HREF = /^(https?:|mailto:|tel:|#|\/|\.)/i;

function sanitizeHrefs(html: string): string {
  return html.replace(/href="([^"]*)"/gi, (full, href: string) => {
    const decoded = href.replace(/&amp;/g, "&").replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));
    return SAFE_HREF.test(decoded.trim()) ? full : 'href="#"';
  });
}

export async function convertDocxToHtml(buffer: ArrayBuffer): Promise<{ html: string; warnings: string[] }> {
  let result;
  try {
    result = await mammoth.convertToHtml({ buffer: Buffer.from(buffer) });
  } catch (err) {
    throw new Error(`Could not read this file as a .docx document: ${(err as Error).message}`);
  }
  return {
    html: sanitizeHrefs(result.value),
    warnings: result.messages.map((m) => m.message),
  };
}
