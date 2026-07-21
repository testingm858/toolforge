// Color Tools — HEX, RGB, HSL converters and palette generator

export interface RGB { r: number; g: number; b: number }
export interface HSL { h: number; s: number; l: number }

export function hexToRgb(hex: string): RGB | null {
  const clean = hex.replace("#", "");
  // parseInt(str, 16) silently parses only the leading valid hex digits and
  // ignores the rest (parseInt("abcxyz", 16) === 2748, not NaN) — combined
  // with no length check, any garbage string of the right length (or a
  // string parseInt could partially parse) produced a "successful" but
  // meaningless RGB result instead of being rejected. Require exactly 3 or
  // 6 valid hex digits, matching what the bit-shifting below assumes.
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(clean)) return null;
  const full = clean.length === 3
    ? clean.split("").map((c) => c + c).join("")
    : clean;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function rgbToHex(r: number, g: number, b: number): string {
  for (const [name, v] of [["r", r], ["g", g], ["b", b]] as const) {
    if (!Number.isFinite(v) || v < 0 || v > 255) throw new Error(`${name} must be a number between 0 and 255`);
  }
  return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

export function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbToHex(Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255));
}

export function generatePalette(baseHex: string): string[] {
  const rgb = hexToRgb(baseHex);
  if (!rgb) throw new Error("Invalid HEX color");
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return [
    hslToHex(h, s, Math.min(l + 40, 95)),
    hslToHex(h, s, Math.min(l + 20, 90)),
    baseHex,
    hslToHex(h, s, Math.max(l - 20, 10)),
    hslToHex(h, s, Math.max(l - 40, 5)),
  ];
}

export function generateComplementaryColors(hex: string): { complementary: string; analogous: string[]; triadic: string[] } {
  const rgb = hexToRgb(hex);
  if (!rgb) throw new Error("Invalid HEX color");
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return {
    complementary: hslToHex((h + 180) % 360, s, l),
    analogous: [hslToHex((h + 30) % 360, s, l), hslToHex((h - 30 + 360) % 360, s, l)],
    triadic: [hslToHex((h + 120) % 360, s, l), hslToHex((h + 240) % 360, s, l)],
  };
}

export function generateCssGradient(
  color1: string,
  color2: string,
  angle = 135,
  type: "linear" | "radial" = "linear"
): string {
  return type === "linear"
    ? `linear-gradient(${angle}deg, ${color1}, ${color2})`
    : `radial-gradient(circle, ${color1}, ${color2})`;
}

export function generateBoxShadow(
  offsetX: number,
  offsetY: number,
  blur: number,
  spread: number,
  color: string,
  inset = false
): string {
  return `${inset ? "inset " : ""}${offsetX}px ${offsetY}px ${blur}px ${spread}px ${color}`;
}
