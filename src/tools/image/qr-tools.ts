// QR code generator — built on the `qrcode` package.

import QRCode from "qrcode";

export async function generateQrCode(
  text: string,
  opts: { size?: number; margin?: number; darkColor?: string; lightColor?: string } = {}
): Promise<Buffer> {
  if (!text || !text.trim()) throw new Error("text is required");
  const size = opts.size ?? 300;
  if (!Number.isFinite(size) || size < 64 || size > 2000) throw new Error("size must be between 64 and 2000");
  const margin = opts.margin ?? 2;
  // The qrcode package's own "width" option is only a cap on the natural
  // (module-count + margin) size — a large margin makes the natural size
  // exceed width and the library renders at that larger size instead.
  // Confirmed: margin:1000 with width:300 produced an 8084x8084px image in
  // ~3s. Bounding margin keeps worst-case output size bounded too.
  if (!Number.isFinite(margin) || margin < 0 || margin > 50) throw new Error("margin must be between 0 and 50");

  return QRCode.toBuffer(text, {
    width: size,
    margin,
    color: {
      dark: opts.darkColor ?? "#000000",
      light: opts.lightColor ?? "#ffffff",
    },
  });
}
