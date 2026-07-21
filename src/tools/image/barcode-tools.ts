// Barcode generator — built on bwip-js (pure JS, renders directly to a PNG
// buffer, no canvas/native dependency).

import bwipjs from "bwip-js/node";

const SUPPORTED_TYPES = ["code128", "ean13", "ean8", "upca", "code39", "itf14"];

export async function generateBarcode(
  text: string,
  opts: { type?: string; scale?: number; height?: number; includeText?: boolean } = {}
): Promise<Buffer> {
  if (!text || !text.trim()) throw new Error("text is required");
  const type = opts.type ?? "code128";
  if (!SUPPORTED_TYPES.includes(type)) {
    throw new Error(`type must be one of: ${SUPPORTED_TYPES.join(", ")}`);
  }
  const scale = opts.scale ?? 3;
  const height = opts.height ?? 10;
  // bwip-js has no internal cap on either — confirmed scale:1000 hangs
  // rendering for 15s+ (never completed), a real resource-exhaustion risk
  // on a public, unauthenticated tool. These caps are already far beyond
  // any realistic barcode/print use (scale:20, height:200 alone render in
  // well under 100ms).
  if (!Number.isFinite(scale) || scale < 1 || scale > 20) throw new Error("scale must be between 1 and 20");
  if (!Number.isFinite(height) || height < 1 || height > 200) throw new Error("height must be between 1 and 200");

  try {
    return await bwipjs.toBuffer({
      bcid: type,
      text,
      scale,
      height,
      includetext: opts.includeText ?? true,
      textxalign: "center",
    });
  } catch (err) {
    throw new Error(`Could not generate barcode: ${(err as Error).message ?? err}`);
  }
}
