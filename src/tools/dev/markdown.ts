// Minimal Markdown -> HTML converter — covers the common subset
// (headers, bold/italic, links, inline code, lists, paragraphs).
// Not a full CommonMark implementation.

// Allowlist safe URL schemes for links — more robust against whitespace/
// case tricks than blocking known-dangerous ones (see word-to-html.ts's
// sanitizeHrefs, which has the same rationale).
const SAFE_HREF = /^(https?:|mailto:|tel:|#|\/|\.)/i;

export function markdownToHtml(input: string): string {
  const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // escapeHtml doesn't escape quotes, which is fine for text content but not
  // for an attribute value — without this, a link target containing a
  // literal `"` breaks out of href="..." entirely. Confirmed:
  // [x](" onmouseover="alert(1)) produced a real injected onmouseover
  // attribute in the output HTML, not just an unsanitized javascript: URI.
  const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

  const inline = (line: string): string => {
    let out = escapeHtml(line);
    out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    // $1/$2 here are already HTML-escaped (they came from escapeHtml(line)
    // above), so decode entities before the scheme check, then re-escape
    // for safe insertion into the href attribute specifically.
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_full, text: string, href: string) => {
      const decoded = href.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
      const safeHref = SAFE_HREF.test(decoded.trim()) ? escapeAttr(decoded) : "#";
      return `<a href="${safeHref}">${text}</a>`;
    });
    return out;
  };

  const lines = input.split("\n");
  const html: string[] = [];
  let inList = false;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    const listItem = /^[-*]\s+(.*)$/.exec(line);

    if (heading) {
      if (inList) { html.push("</ul>"); inList = false; }
      const level = heading[1].length;
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    if (listItem) {
      if (!inList) { html.push("<ul>"); inList = true; }
      html.push(`<li>${inline(listItem[1])}</li>`);
      continue;
    }

    if (inList) { html.push("</ul>"); inList = false; }

    if (line.trim() === "") continue;
    html.push(`<p>${inline(line)}</p>`);
  }
  if (inList) html.push("</ul>");

  return html.join("\n");
}
