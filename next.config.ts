import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp and @napi-rs/canvas ship native .node binaries, and ffmpeg-static
  // ships a standalone .exe/binary — all three need Node to resolve their
  // real on-disk path at runtime. Left to the bundler, it either rewrites
  // that path to a bogus "\ROOT\..." placeholder (ffmpeg-static) or can't
  // locate the native binding at all (sharp, @napi-rs/canvas). tesseract.js
  // hits the same "\ROOT\..." placeholder bug — it spawns a real Node
  // worker_threads Worker from a computed on-disk path
  // (node_modules/tesseract.js/src/worker-script/node/index.js) that
  // Turbopack's tracer mangles the same way it mangled ffmpeg-static's path.
  serverExternalPackages: ["sharp", "ffmpeg-static", "@napi-rs/canvas", "tesseract.js", "tesseract.js-core"],
};

export default nextConfig;
