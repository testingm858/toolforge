// Favicon Generator — produces the standard set of favicon PNG sizes via
// sharp and bundles them into a zip via jszip. We don't emit a true
// multi-resolution .ico container (that's a distinct binary format sharp
// doesn't write) — browsers and app manifests all accept a 32x32 PNG as
// favicon.png just fine, so we ship that plus the other standard sizes and
// a ready-to-paste <link> snippet instead of a single .ico file.

import sharp from "sharp";
import JSZip from "jszip";

const SIZES: { name: string; size: number }[] = [
  { name: "favicon-16x16.png", size: 16 },
  { name: "favicon-32x32.png", size: 32 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "android-chrome-192x192.png", size: 192 },
  { name: "android-chrome-512x512.png", size: 512 },
];

const HTML_SNIPPET = `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">`;

export async function generateFaviconSet(buffer: ArrayBuffer): Promise<Buffer> {
  const zip = new JSZip();
  for (const { name, size } of SIZES) {
    const png = await sharp(Buffer.from(buffer))
      .resize(size, size, { fit: "cover" })
      .png()
      .toBuffer();
    zip.file(name, png);
  }
  zip.file("README.txt", `Add these tags to your <head>:\n\n${HTML_SNIPPET}\n`);
  return zip.generateAsync({ type: "nodebuffer" });
}
