// Simple line-based text utilities — no deps.

export function removeDuplicateLines(input: string): { result: string; removed: number } {
  const lines = input.split("\n");
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of lines) {
    if (!seen.has(line)) { seen.add(line); out.push(line); }
  }
  return { result: out.join("\n"), removed: lines.length - out.length };
}

export function removeExtraSpaces(input: string): string {
  return input
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

export function sortLines(input: string, direction: "asc" | "desc" = "asc", caseSensitive = false): string {
  const lines = input.split("\n").filter((l) => l.length > 0);
  const compare = (a: string, b: string) => {
    const x = caseSensitive ? a : a.toLowerCase();
    const y = caseSensitive ? b : b.toLowerCase();
    return x < y ? -1 : x > y ? 1 : 0;
  };
  lines.sort(compare);
  if (direction === "desc") lines.reverse();
  return lines.join("\n");
}

export function reverseText(input: string, mode: "characters" | "words" | "lines" = "characters"): string {
  // input.split("") splits by UTF-16 code unit, not Unicode code point — any
  // character outside the BMP (emoji, many CJK extension characters) is a
  // surrogate pair, and reversing its two halves independently corrupts it
  // into lone surrogates (confirmed: "Hi 😀 there" reversed to "ereht ?? iH"
  // instead of correctly keeping the emoji intact). Array.from iterates by
  // code point and reverses correctly.
  if (mode === "characters") return Array.from(input).reverse().join("");
  if (mode === "words") return input.split(/\s+/).reverse().join(" ");
  return input.split("\n").reverse().join("\n");
}

const ADJECTIVES = ["swift", "brave", "calm", "eager", "gentle", "bright", "cosmic", "lunar", "quiet", "bold"];
const NOUNS = ["falcon", "otter", "comet", "willow", "harbor", "ember", "cedar", "raven", "delta", "quartz"];

export function generateUsernames(count: number, style: "word" | "wordnumber" = "wordnumber"): string[] {
  if (!Number.isFinite(count) || count <= 0 || count > 50) throw new Error("count must be between 1 and 50");
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const base = `${adj}${noun.charAt(0).toUpperCase()}${noun.slice(1)}`;
    out.push(style === "word" ? base : `${base}${Math.floor(Math.random() * 900) + 100}`);
  }
  return out;
}
