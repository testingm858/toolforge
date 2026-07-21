// JSON Formatter Tool — pure client-side, no deps needed

export interface JsonFormatterResult {
  formatted: string;
  valid: boolean;
  error?: string;
  lineCount?: number;
  charCount?: number;
}

export function formatJson(input: string, indent = 2): JsonFormatterResult {
  if (!input.trim()) return { formatted: "", valid: false, error: "Input is empty" };
  try {
    const parsed = JSON.parse(input);
    const formatted = JSON.stringify(parsed, null, indent);
    return {
      formatted,
      valid: true,
      lineCount: formatted.split("\n").length,
      charCount: formatted.length,
    };
  } catch (err) {
    return {
      formatted: input,
      valid: false,
      error: (err as Error).message,
    };
  }
}

export function minifyJson(input: string): JsonFormatterResult {
  if (!input.trim()) return { formatted: "", valid: false, error: "Input is empty" };
  try {
    const parsed = JSON.parse(input);
    const formatted = JSON.stringify(parsed);
    return { formatted, valid: true, charCount: formatted.length };
  } catch (err) {
    return { formatted: input, valid: false, error: (err as Error).message };
  }
}

export function validateJson(input: string): { valid: boolean; error?: string } {
  try {
    JSON.parse(input);
    return { valid: true };
  } catch (err) {
    return { valid: false, error: (err as Error).message };
  }
}
