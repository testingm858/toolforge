// Case Converter — pure JS

export type CaseType = "upper" | "lower" | "title" | "sentence" | "camel" | "pascal" | "snake" | "kebab" | "constant";

export function convertCase(text: string, type: CaseType): string {
  switch (type) {
    case "upper":    return text.toUpperCase();
    case "lower":    return text.toLowerCase();
    case "title":    return text.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
    case "sentence": return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    case "camel":    return text.replace(/(?:^\w|[A-Z]|\b\w)/g, (w, i) => i === 0 ? w.toLowerCase() : w.toUpperCase()).replace(/\s+/g, "");
    case "pascal":   return text.replace(/(?:^\w|[A-Z]|\b\w)/g, (w) => w.toUpperCase()).replace(/\s+/g, "");
    case "snake":    return text.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    case "kebab":    return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    case "constant": return text.toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");
    default:         return text;
  }
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function countWords(text: string) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const charsNoSpaces = text.replace(/\s/g, "").length;
  const sentences = text.split(/[.!?]+/).filter(Boolean).length;
  const paragraphs = text.split(/\n\n+/).filter(Boolean).length;
  const readingTimeMin = Math.ceil(words / 200);
  return { words, chars, charsNoSpaces, sentences, paragraphs, readingTimeMin };
}
