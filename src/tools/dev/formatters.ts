// Markup/stylesheet/script formatters and minifiers — simple, dependency-free
// bracket/tag-based indenting. Not a full parser: good enough for tidying
// hand-written or copy-pasted code, not a substitute for a real AST formatter.

export function formatXml(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Input is empty");
  const withBreaks = trimmed.replace(/>\s*</g, "><").replace(/></g, ">\n<");
  const lines = withBreaks.split("\n");
  let indent = 0;
  const out: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const isClosing = /^<\//.test(line);
    const isSelfClosing = /\/>$/.test(line) || /^<\?/.test(line) || /^<!--.*-->$/.test(line);
    const isOpeningOnly = /^<[^/!?][^>]*[^/]>$/.test(line) && !/<\/[^>]+>$/.test(line);
    if (isClosing) indent = Math.max(0, indent - 1);
    out.push("  ".repeat(indent) + line);
    if (isOpeningOnly && !isSelfClosing) indent++;
  }
  return out.join("\n");
}

export function formatHtml(input: string): string {
  return formatXml(input);
}

export function minifyHtml(input: string): string {
  if (!input.trim()) throw new Error("Input is empty");
  return input
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function formatCss(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Input is empty");
  const compact = trimmed.replace(/\s*([{}:;,])\s*/g, "$1").replace(/;}/g, "}");
  let indent = 0;
  let out = "";
  for (let i = 0; i < compact.length; i++) {
    const ch = compact[i];
    if (ch === "{") {
      out += " {\n";
      indent++;
      out += "  ".repeat(indent);
    } else if (ch === "}") {
      indent = Math.max(0, indent - 1);
      out = out.replace(/\s+$/, "");
      out += "\n" + "  ".repeat(indent) + "}\n" + "  ".repeat(indent);
    } else if (ch === ";") {
      out += ";\n" + "  ".repeat(indent);
    } else {
      out += ch;
    }
  }
  return out.replace(/\n\s*\n/g, "\n").replace(/[ \t]+$/gm, "").trim();
}

export function minifyCss(input: string): string {
  if (!input.trim()) throw new Error("Input is empty");
  return input
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s*([{}:;,])\s*/g, "$1")
    .replace(/;}/g, "}")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function beautifyJs(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Input is empty");
  let indent = 0;
  let out = "";
  let inString: string | null = null;
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    const prev = trimmed[i - 1];
    if (inString) {
      out += ch;
      if (ch === inString && prev !== "\\") inString = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inString = ch;
      out += ch;
      continue;
    }
    if (ch === "{" || ch === "[") {
      indent++;
      out += ch + "\n" + "  ".repeat(indent);
    } else if (ch === "}" || ch === "]") {
      indent = Math.max(0, indent - 1);
      out = out.replace(/[ \t]+$/, "");
      out += "\n" + "  ".repeat(indent) + ch;
    } else if (ch === ";") {
      out += ch + "\n" + "  ".repeat(indent);
    } else {
      out += ch;
    }
  }
  return out
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .filter((l, idx, arr) => l.trim() !== "" || (idx > 0 && arr[idx - 1].trim() !== ""))
    .join("\n")
    .trim();
}

export function minifyJs(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Input is empty");
  let out = "";
  let inString: string | null = null;
  let inLineComment = false;
  let inBlockComment = false;
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    const next = trimmed[i + 1];
    if (inLineComment) {
      if (ch === "\n") inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === "*" && next === "/") { inBlockComment = false; i++; }
      continue;
    }
    if (inString) {
      out += ch;
      if (ch === inString && trimmed[i - 1] !== "\\") inString = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") { inString = ch; out += ch; continue; }
    if (ch === "/" && next === "/") { inLineComment = true; i++; continue; }
    if (ch === "/" && next === "*") { inBlockComment = true; i++; continue; }
    if (/\s/.test(ch)) {
      if (!/\s$/.test(out) && out.length > 0) out += " ";
      continue;
    }
    out += ch;
  }
  return out
    .replace(/\s*([{}();,:=+\-*/<>!&|?])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

export function formatSql(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Input is empty");
  const keywords = [
    "SELECT", "FROM", "WHERE", "GROUP BY", "ORDER BY", "HAVING", "LIMIT",
    "INSERT INTO", "VALUES", "UPDATE", "SET", "DELETE FROM",
    "LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "OUTER JOIN", "JOIN", "ON",
    "AND", "OR", "UNION ALL", "UNION",
  ];
  let sql = " " + trimmed.replace(/\s+/g, " ") + " ";
  for (const kw of keywords) {
    const re = new RegExp(`\\s+(${kw.replace(/\s+/g, "\\s+")})\\s+`, "gi");
    sql = sql.replace(re, `\n${kw} `);
  }
  return sql
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n");
}
