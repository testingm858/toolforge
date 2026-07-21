// Audio conversion + watermarking — shells out to the ffmpeg binary bundled
// by ffmpeg-static via child_process. Uses temp files rather than
// stdin/stdout piping: some container formats (ogg, flac) need a seekable
// output, which pipes don't reliably give you, so temp files are the safer
// choice here even though it's a bit more bookkeeping.

import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import ffmpegPath from "ffmpeg-static";

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath as string, args);
    let stderr = "";
    proc.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Audio processing failed: ${stderr.trim().split("\n").slice(-3).join(" ") || `ffmpeg exited with code ${code}`}`));
      } else {
        resolve();
      }
    });
  });
}

function tempPath(ext: string): string {
  return path.join(os.tmpdir(), `toolforge-${crypto.randomUUID()}.${ext}`);
}

async function cleanup(...paths: string[]): Promise<void> {
  await Promise.all(paths.map((p) => fs.unlink(p).catch(() => {})));
}

export type AudioFormat = "mp3" | "wav" | "ogg" | "flac";

const FORMAT_ARGS: Record<AudioFormat, string[]> = {
  mp3: ["-acodec", "libmp3lame", "-f", "mp3"],
  wav: ["-f", "wav"],
  ogg: ["-acodec", "libvorbis", "-f", "ogg"],
  flac: ["-acodec", "flac", "-f", "flac"],
};

export const AUDIO_CONTENT_TYPE: Record<AudioFormat, string> = {
  mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", flac: "audio/flac",
};

function guessExt(filename: string | undefined, fallback = "audio"): string {
  const ext = filename?.split(".").pop()?.toLowerCase();
  return ext && /^[a-z0-9]{1,5}$/.test(ext) ? ext : fallback;
}

export async function convertAudio(
  buffer: ArrayBuffer,
  inputFilename: string | undefined,
  targetFormat: string
): Promise<Buffer> {
  if (!(targetFormat in FORMAT_ARGS)) {
    throw new Error(`format must be one of: ${Object.keys(FORMAT_ARGS).join(", ")}`);
  }
  const format = targetFormat as AudioFormat;
  const inPath = tempPath(guessExt(inputFilename));
  const outPath = tempPath(format);

  await fs.writeFile(inPath, Buffer.from(buffer));
  try {
    await runFfmpeg(["-y", "-i", inPath, ...FORMAT_ARGS[format], outPath]);
    return await fs.readFile(outPath);
  } finally {
    await cleanup(inPath, outPath);
  }
}

export async function watermarkAudio(
  mainBuffer: ArrayBuffer,
  mainFilename: string | undefined,
  watermarkBuffer: ArrayBuffer,
  watermarkFilename: string | undefined,
  opts: { volume?: number } = {}
): Promise<Buffer> {
  const volume = opts.volume ?? 0.35;
  if (!Number.isFinite(volume) || volume < 0 || volume > 1) {
    throw new Error("volume must be between 0 and 1");
  }

  const mainPath = tempPath(guessExt(mainFilename));
  const wmPath = tempPath(guessExt(watermarkFilename));
  const outPath = tempPath("mp3");

  await fs.writeFile(mainPath, Buffer.from(mainBuffer));
  await fs.writeFile(wmPath, Buffer.from(watermarkBuffer));
  try {
    // Loop the watermark clip indefinitely at reduced volume and mix it
    // continuously under the main track, trimmed to the main track's length.
    await runFfmpeg([
      "-y",
      "-i", mainPath,
      "-i", wmPath,
      "-filter_complex", `[1:a]aloop=loop=-1:size=2e9,volume=${volume}[wm];[0:a][wm]amix=inputs=2:duration=first:dropout_transition=0[out]`,
      "-map", "[out]",
      "-acodec", "libmp3lame",
      "-f", "mp3",
      outPath,
    ]);
    return await fs.readFile(outPath);
  } finally {
    await cleanup(mainPath, wmPath, outPath);
  }
}
