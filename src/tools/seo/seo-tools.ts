// Remaining pure SEO generators/analyzers — no external API needed.
//
// Every generator below produces an HTML/XML snippet whose entire purpose
// is to be pasted directly into the user's own <head> — unlike a live
// server-rendered page, so this isn't an XSS against ToolForge itself, but
// an unescaped attribute value is a real, direct XSS-in-waiting for
// whatever site the user pastes it into (e.g. a title copied from
// untrusted CMS/scraped content). Confirmed: an unescaped title of
// `foo" onmouseover="alert(1)` produced a working injected attribute in
// generateTwitterCard's output. generateCanonicalUrl is fine as-is — the
// URL constructor already percent-encodes quotes/angle-brackets.
export const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function generateCanonicalUrl(url: string): { html: string; url: string } {
  if (!url) throw new Error("url is required");
  let normalized: string;
  try {
    normalized = new URL(url).toString();
  } catch {
    throw new Error("Invalid URL");
  }
  return { html: `<link rel="canonical" href="${normalized}">`, url: normalized };
}

export function generateTwitterCard(body: {
  card?: "summary" | "summary_large_image" | "app" | "player";
  title?: string; description?: string; image?: string; site?: string; creator?: string;
}): { html: string } {
  const { card = "summary_large_image", title, description, image, site, creator } = body;
  const lines = [`<meta name="twitter:card" content="${escapeAttr(card)}">`];
  if (site) lines.push(`<meta name="twitter:site" content="${escapeAttr(site)}">`);
  if (creator) lines.push(`<meta name="twitter:creator" content="${escapeAttr(creator)}">`);
  if (title) lines.push(`<meta name="twitter:title" content="${escapeAttr(title)}">`);
  if (description) lines.push(`<meta name="twitter:description" content="${escapeAttr(description)}">`);
  if (image) lines.push(`<meta name="twitter:image" content="${escapeAttr(image)}">`);
  return { html: lines.join("\n") };
}

export function generateHreflang(pages: { lang: string; url: string }[], defaultUrl?: string): { html: string } {
  if (!Array.isArray(pages) || pages.length === 0) throw new Error("pages must be a non-empty array of { lang, url }");
  const lines = pages.map((p) => `<link rel="alternate" hreflang="${escapeAttr(p.lang)}" href="${escapeAttr(p.url)}">`);
  if (defaultUrl) lines.push(`<link rel="alternate" hreflang="x-default" href="${escapeAttr(defaultUrl)}">`);
  return { html: lines.join("\n") };
}

export function analyzeKeywordDensity(text: string, targetKeyword?: string): {
  totalWords: number;
  topKeywords: { word: string; count: number; density: number }[];
  targetKeywordDensity: number | null;
} {
  const cleaned = text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ");
  const words = cleaned.split(/\s+/).filter((w) => w.length > 2);
  const totalWords = words.length;
  if (totalWords === 0) throw new Error("Input has no analyzable words");

  const counts = new Map<string, number>();
  for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);

  const topKeywords = Array.from(counts.entries())
    .map(([word, count]) => ({ word, count, density: Math.round((count / totalWords) * 10000) / 100 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  let targetKeywordDensity: number | null = null;
  if (targetKeyword) {
    const key = targetKeyword.toLowerCase().trim();
    const count = counts.get(key) ?? 0;
    targetKeywordDensity = Math.round((count / totalWords) * 10000) / 100;
  }

  return { totalWords, topKeywords, targetKeywordDensity };
}

export interface SitemapUrl { loc: string; lastmod?: string; changefreq?: string; priority?: number }

export function generateSitemap(urls: SitemapUrl[]): { xml: string } {
  if (!Array.isArray(urls) || urls.length === 0) throw new Error("urls must be a non-empty array of { loc }");
  const entries = urls.map((u) => {
    if (!u.loc) throw new Error("Every entry needs a loc URL");
    const parts = [`    <loc>${escapeAttr(u.loc)}</loc>`];
    if (u.lastmod) parts.push(`    <lastmod>${escapeAttr(u.lastmod)}</lastmod>`);
    if (u.changefreq) parts.push(`    <changefreq>${escapeAttr(u.changefreq)}</changefreq>`);
    if (u.priority !== undefined) parts.push(`    <priority>${u.priority}</priority>`);
    return `  <url>\n${parts.join("\n")}\n  </url>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>`;
  return { xml };
}

export function htmlEncode(input: string): string {
  return input.replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]!));
}

export function htmlDecode(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}
