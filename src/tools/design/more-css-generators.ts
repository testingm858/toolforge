// More CSS generators — buttons, keyframe animations, grid/flexbox layouts,
// SVG blobs. Pure string/math generation, no deps.

export function generateButtonCss(opts: {
  bg?: string; color?: string; hoverBg?: string;
  paddingY?: number; paddingX?: number; radius?: number; fontSize?: number;
}): { css: string } {
  const {
    bg = "#7c3aed", color = "#ffffff", hoverBg = "#6d28d9",
    paddingY = 12, paddingX = 24, radius = 8, fontSize = 16,
  } = opts;
  const css = `.btn {
  background-color: ${bg};
  color: ${color};
  padding: ${paddingY}px ${paddingX}px;
  border-radius: ${radius}px;
  font-size: ${fontSize}px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn:hover {
  background-color: ${hoverBg};
}`;
  return { css };
}

export function generateKeyframeAnimation(opts: {
  name?: string;
  type?: "fade" | "slide-up" | "slide-in" | "bounce" | "spin" | "pulse";
  durationSeconds?: number;
  easing?: string;
  iterationCount?: string;
}): { css: string } {
  const { name = "animate", type = "fade", durationSeconds = 0.6, easing = "ease", iterationCount = "1" } = opts;

  const keyframesByType: Record<string, string> = {
    fade: `0% { opacity: 0; }\n  100% { opacity: 1; }`,
    "slide-up": `0% { opacity: 0; transform: translateY(20px); }\n  100% { opacity: 1; transform: translateY(0); }`,
    "slide-in": `0% { opacity: 0; transform: translateX(-20px); }\n  100% { opacity: 1; transform: translateX(0); }`,
    bounce: `0%, 100% { transform: translateY(0); }\n  50% { transform: translateY(-15px); }`,
    spin: `0% { transform: rotate(0deg); }\n  100% { transform: rotate(360deg); }`,
    pulse: `0%, 100% { transform: scale(1); }\n  50% { transform: scale(1.05); }`,
  };

  const body = keyframesByType[type];
  if (!body) throw new Error(`type must be one of: ${Object.keys(keyframesByType).join(", ")}`);

  const css = `@keyframes ${name} {
  ${body}
}

.${name} {
  animation: ${name} ${durationSeconds}s ${easing} ${iterationCount};
}`;
  return { css };
}

export function generateGridCss(opts: { columns?: number; rows?: number; gap?: number; columnWidths?: string; rowHeights?: string }): { css: string } {
  const { columns = 3, rows = 2, gap = 16, columnWidths, rowHeights } = opts;
  if (!Number.isFinite(columns) || columns < 1) throw new Error("columns must be a positive integer");
  if (!Number.isFinite(rows) || rows < 1) throw new Error("rows must be a positive integer");
  const css = `.grid-container {
  display: grid;
  grid-template-columns: ${columnWidths ?? `repeat(${columns}, 1fr)`};
  grid-template-rows: ${rowHeights ?? `repeat(${rows}, 1fr)`};
  gap: ${gap}px;
}`;
  return { css };
}

export function generateFlexboxCss(opts: {
  direction?: "row" | "column" | "row-reverse" | "column-reverse";
  justify?: string; align?: string; wrap?: "nowrap" | "wrap" | "wrap-reverse"; gap?: number;
}): { css: string } {
  const { direction = "row", justify = "flex-start", align = "stretch", wrap = "nowrap", gap = 16 } = opts;
  const css = `.flex-container {
  display: flex;
  flex-direction: ${direction};
  justify-content: ${justify};
  align-items: ${align};
  flex-wrap: ${wrap};
  gap: ${gap}px;
}`;
  return { css };
}

function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateSvgBlob(opts: { size?: number; complexity?: number; seed?: number; color?: string }): { svg: string } {
  const { size = 200, complexity = 6, seed = Math.floor(Math.random() * 10000), color = "#7c3aed" } = opts;
  if (!Number.isFinite(size) || size < 10 || size > 2000) throw new Error("size must be between 10 and 2000");
  if (complexity < 3 || complexity > 12) throw new Error("complexity must be between 3 and 12");
  const rand = seededRandom(seed);
  const cx = size / 2, cy = size / 2, baseR = size * 0.35;
  const points: [number, number][] = [];
  for (let i = 0; i < complexity; i++) {
    const angle = (i / complexity) * Math.PI * 2;
    const r = baseR * (0.75 + rand() * 0.5);
    points.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  let d = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)} `;
  for (let i = 0; i < points.length; i++) {
    const p0 = points[i];
    const p1 = points[(i + 1) % points.length];
    const mx = (p0[0] + p1[0]) / 2;
    const my = (p0[1] + p1[1]) / 2;
    d += `Q ${p0[0].toFixed(1)} ${p0[1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)} `;
  }
  d += "Z";
  const svg = `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><path d="${d}" fill="${color}" /></svg>`;
  return { svg };
}
