// File-upload tool dispatcher — handles multipart/form-data requests
// (PDF/image tools) as opposed to the JSON dispatcher in route.ts.

import {
  mergePdfs, rotatePdf, addWatermark, addPageNumbers, removePages,
  extractPages, reorderPages, readMetadata, writeMetadata, compressPdf,
  imagesToPdf, stampSignature,
} from "@/tools/pdf/pdf-tools";
import {
  compressImage, resizeImage, cropImage, rotateImage, convertImage,
  svgToRaster, getImageMetadata, stripImageMetadata, pickColorAtPixel,
  contentTypeForFormat, type ImageFormat,
} from "@/tools/image/image-tools";
import { imageToBase64 } from "@/tools/image/base64-image";
import { generateFaviconSet } from "@/tools/image/favicon-generator";
import { convertDocxToHtml } from "@/tools/text/word-to-html";
import { convertAudio, watermarkAudio, AUDIO_CONTENT_TYPE, type AudioFormat } from "@/tools/audio/audio-tools";
import { renderPdfPagesToJpg } from "@/tools/pdf/pdf-to-image";
import { convertDocxToPdf } from "@/tools/pdf/word-to-pdf";
import { convertPdfToDocx } from "@/tools/pdf/pdf-to-word";
import { protectPdf, unlockPdf } from "@/tools/pdf/pdf-protect";
import { ocrPdf } from "@/tools/pdf/pdf-ocr";
import JSZip from "jszip";
import { buildDownloadName } from "@/lib/file-download-name";

const DOCX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export interface FileDispatchResult {
  bytes?: Uint8Array;
  filename?: string;
  contentType?: string;
  json?: unknown;
  extraHeaders?: Record<string, string>;
}

function parseOptions(raw: FormDataEntryValue | null): Record<string, unknown> {
  if (!raw || typeof raw !== "string" || raw.trim() === "") return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error();
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new Error("Invalid JSON in options field");
  }
}

async function fileToBuffer(file: FormDataEntryValue | null, label = "file"): Promise<ArrayBuffer> {
  if (!(file instanceof File)) throw new Error(`${label} is required`);
  if (file.size === 0) throw new Error(`${label} is empty`);
  return file.arrayBuffer();
}

function fileName(file: FormDataEntryValue | null): string | undefined {
  return file instanceof File ? file.name : undefined;
}

// Every bytes-returning tool reports how the output size compares to the
// input — the client renders this as the before/after size chart. Merged
// with any tool-specific extraHeaders (e.g. pdf-compress's X-Note).
function sizeHeaders(originalBytes: number, newBytes: number): Record<string, string> {
  return { "X-Original-Size": String(originalBytes), "X-New-Size": String(newBytes) };
}

export async function dispatchFile(toolId: string, formData: FormData): Promise<FileDispatchResult> {
  const options = parseOptions(formData.get("options"));

  switch (toolId) {
    case "pdf-merge": {
      const files = formData.getAll("files").filter((f): f is File => f instanceof File);
      if (files.length < 2) throw new Error("Upload at least 2 PDF files to merge");
      const buffers = await Promise.all(files.map((f) => f.arrayBuffer()));
      const bytes = await mergePdfs(buffers);
      const originalSize = buffers.reduce((sum, b) => sum + b.byteLength, 0);
      return {
        bytes, filename: buildDownloadName(files[0].name, "merged", "pdf"), contentType: "application/pdf",
        extraHeaders: sizeHeaders(originalSize, bytes.byteLength),
      };
    }

    case "jpg-to-pdf": {
      const files = formData.getAll("files").filter((f): f is File => f instanceof File);
      if (files.length === 0) throw new Error("Upload at least one image");
      const buffers = await Promise.all(files.map((f) => f.arrayBuffer()));
      const bytes = await imagesToPdf(buffers);
      const originalSize = buffers.reduce((sum, b) => sum + b.byteLength, 0);
      return {
        bytes, filename: buildDownloadName(files[0].name, "converted", "pdf"), contentType: "application/pdf",
        extraHeaders: sizeHeaders(originalSize, bytes.byteLength),
      };
    }

    case "pdf-rotate": {
      const file = formData.get("file");
      const buffer = await fileToBuffer(file);
      const bytes = await rotatePdf(buffer, (options.angle as number) ?? 90);
      return {
        bytes, filename: buildDownloadName(fileName(file), "rotated", "pdf"), contentType: "application/pdf",
        extraHeaders: sizeHeaders(buffer.byteLength, bytes.byteLength),
      };
    }

    case "pdf-watermark": {
      const file = formData.get("file");
      const buffer = await fileToBuffer(file);
      if (!options.text) throw new Error('options.text is required, e.g. {"text": "CONFIDENTIAL"}');
      const bytes = await addWatermark(buffer, options.text as string, options.opacity as number | undefined);
      return {
        bytes, filename: buildDownloadName(fileName(file), "watermarked", "pdf"), contentType: "application/pdf",
        extraHeaders: sizeHeaders(buffer.byteLength, bytes.byteLength),
      };
    }

    case "pdf-page-numbers": {
      const file = formData.get("file");
      const buffer = await fileToBuffer(file);
      const bytes = await addPageNumbers(buffer, options as Parameters<typeof addPageNumbers>[1]);
      return {
        bytes, filename: buildDownloadName(fileName(file), "numbered", "pdf"), contentType: "application/pdf",
        extraHeaders: sizeHeaders(buffer.byteLength, bytes.byteLength),
      };
    }

    case "pdf-remove-pages": {
      const file = formData.get("file");
      const buffer = await fileToBuffer(file);
      if (!Array.isArray(options.pages)) throw new Error('options.pages is required, e.g. {"pages": [2, 4]}');
      const bytes = await removePages(buffer, options.pages as number[]);
      return {
        bytes, filename: buildDownloadName(fileName(file), "pages_removed", "pdf"), contentType: "application/pdf",
        extraHeaders: sizeHeaders(buffer.byteLength, bytes.byteLength),
      };
    }

    case "pdf-extract-pages":
    case "pdf-split": {
      const file = formData.get("file");
      const buffer = await fileToBuffer(file);
      if (!Array.isArray(options.pages)) throw new Error('options.pages is required, e.g. {"pages": [1, 3, 5]}');
      const bytes = await extractPages(buffer, options.pages as number[]);
      const suffix = toolId === "pdf-split" ? "split" : "extracted";
      return {
        bytes, filename: buildDownloadName(fileName(file), suffix, "pdf"), contentType: "application/pdf",
        extraHeaders: sizeHeaders(buffer.byteLength, bytes.byteLength),
      };
    }

    case "pdf-organize": {
      const file = formData.get("file");
      const buffer = await fileToBuffer(file);
      if (!Array.isArray(options.order)) throw new Error('options.order is required, e.g. {"order": [3, 1, 2]}');
      const bytes = await reorderPages(buffer, options.order as number[]);
      return {
        bytes, filename: buildDownloadName(fileName(file), "reordered", "pdf"), contentType: "application/pdf",
        extraHeaders: sizeHeaders(buffer.byteLength, bytes.byteLength),
      };
    }

    case "pdf-to-jpg": {
      const file = formData.get("file");
      const buffer = await fileToBuffer(file);
      const pages = Array.isArray(options.pages) && options.pages.length > 0 ? (options.pages as number[]) : undefined;
      const { images, pageNumbers } = await renderPdfPagesToJpg(buffer, { pages });

      if (images.length === 1) {
        return {
          bytes: images[0], filename: buildDownloadName(fileName(file), `page-${pageNumbers[0]}`, "jpg"), contentType: "image/jpeg",
          extraHeaders: sizeHeaders(buffer.byteLength, images[0].byteLength),
        };
      }

      const zip = new JSZip();
      images.forEach((img, i) => zip.file(`page-${pageNumbers[i]}.jpg`, img));
      const bytes = await zip.generateAsync({ type: "nodebuffer" });
      return {
        bytes, filename: buildDownloadName(fileName(file), "pages", "zip"), contentType: "application/zip",
        extraHeaders: sizeHeaders(buffer.byteLength, bytes.byteLength),
      };
    }

    case "pdf-metadata": {
      const file = formData.get("file");
      const buffer = await fileToBuffer(file);
      const hasWrite = Object.keys(options).length > 0;
      if (!hasWrite) return { json: await readMetadata(buffer) };
      const bytes = await writeMetadata(buffer, options as Parameters<typeof writeMetadata>[1]);
      return {
        bytes, filename: buildDownloadName(fileName(file), "metadata_updated", "pdf"), contentType: "application/pdf",
        extraHeaders: sizeHeaders(buffer.byteLength, bytes.byteLength),
      };
    }

    case "pdf-compress": {
      const file = formData.get("file");
      const buffer = await fileToBuffer(file);
      const { bytes, originalSize, newSize, note } = await compressPdf(buffer);
      return {
        bytes, filename: buildDownloadName(fileName(file), "compressed", "pdf"), contentType: "application/pdf",
        extraHeaders: { ...sizeHeaders(originalSize, newSize), "X-Note": note },
      };
    }

    case "pdf-sign": {
      const file = formData.get("file");
      const buffer = await fileToBuffer(file);
      if (!options.signatureText) throw new Error('options.signatureText is required, e.g. {"signatureText": "Jane Doe"}');
      const bytes = await stampSignature(buffer, options.signatureText as string, options.page as number | undefined);
      return {
        bytes, filename: buildDownloadName(fileName(file), "signed", "pdf"), contentType: "application/pdf",
        extraHeaders: sizeHeaders(buffer.byteLength, bytes.byteLength),
      };
    }

    case "image-compress": {
      const file = formData.get("file");
      const buffer = await fileToBuffer(file);
      const { bytes, format, originalSize, newSize } = await compressImage(buffer, (options.quality as number) ?? 40);
      return {
        bytes, filename: buildDownloadName(fileName(file), "compressed", format), contentType: contentTypeForFormat(format),
        extraHeaders: sizeHeaders(originalSize, newSize),
      };
    }

    case "image-resize": {
      const file = formData.get("file");
      const buffer = await fileToBuffer(file);
      const { bytes, format } = await resizeImage(buffer, options as Parameters<typeof resizeImage>[1]);
      return {
        bytes, filename: buildDownloadName(fileName(file), "resized", format), contentType: contentTypeForFormat(format),
        extraHeaders: sizeHeaders(buffer.byteLength, bytes.byteLength),
      };
    }

    case "image-crop": {
      const file = formData.get("file");
      const buffer = await fileToBuffer(file);
      if (options.left === undefined || options.top === undefined || options.width === undefined || options.height === undefined) {
        throw new Error('options must include left, top, width, height, e.g. {"left":0,"top":0,"width":300,"height":300}');
      }
      const { bytes, format } = await cropImage(buffer, options as Parameters<typeof cropImage>[1]);
      return {
        bytes, filename: buildDownloadName(fileName(file), "cropped", format), contentType: contentTypeForFormat(format),
        extraHeaders: sizeHeaders(buffer.byteLength, bytes.byteLength),
      };
    }

    case "image-rotate": {
      const file = formData.get("file");
      const buffer = await fileToBuffer(file);
      const { bytes, format } = await rotateImage(buffer, (options.angle as number) ?? 90);
      return {
        bytes, filename: buildDownloadName(fileName(file), "rotated", format), contentType: contentTypeForFormat(format),
        extraHeaders: sizeHeaders(buffer.byteLength, bytes.byteLength),
      };
    }

    case "image-convert": {
      const file = formData.get("file");
      const buffer = await fileToBuffer(file);
      const format = (options.format as string) ?? "png";
      const bytes = await convertImage(buffer, format);
      return {
        bytes, filename: buildDownloadName(fileName(file), "converted", format), contentType: contentTypeForFormat(format as ImageFormat),
        extraHeaders: sizeHeaders(buffer.byteLength, bytes.byteLength),
      };
    }

    case "svg-converter": {
      const file = formData.get("file");
      const buffer = await fileToBuffer(file);
      const format = (options.format as string) ?? "png";
      const bytes = await svgToRaster(buffer, format, options.width as number | undefined);
      return {
        bytes, filename: buildDownloadName(fileName(file), "converted", format), contentType: contentTypeForFormat(format as ImageFormat),
        extraHeaders: sizeHeaders(buffer.byteLength, bytes.byteLength),
      };
    }

    case "image-metadata": {
      const buffer = await fileToBuffer(formData.get("file"));
      return { json: await getImageMetadata(buffer) };
    }

    case "image-metadata-remove": {
      const file = formData.get("file");
      const buffer = await fileToBuffer(file);
      const { bytes, format } = await stripImageMetadata(buffer);
      return {
        bytes, filename: buildDownloadName(fileName(file), "metadata_removed", format), contentType: contentTypeForFormat(format),
        extraHeaders: sizeHeaders(buffer.byteLength, bytes.byteLength),
      };
    }

    case "color-picker": {
      const buffer = await fileToBuffer(formData.get("file"));
      if (options.x === undefined || options.y === undefined) throw new Error('options must include x and y, e.g. {"x":10,"y":10}');
      return { json: await pickColorAtPixel(buffer, options.x as number, options.y as number) };
    }

    case "image-to-base64": {
      const file = formData.get("file");
      const buffer = await fileToBuffer(file);
      const mimeType = file instanceof File ? file.type || "image/png" : "image/png";
      return { json: imageToBase64(buffer, mimeType) };
    }

    case "favicon-generator": {
      const file = formData.get("file");
      const buffer = await fileToBuffer(file);
      const bytes = await generateFaviconSet(buffer);
      return {
        bytes, filename: buildDownloadName(fileName(file), "favicons", "zip"), contentType: "application/zip",
        extraHeaders: sizeHeaders(buffer.byteLength, bytes.byteLength),
      };
    }

    case "word-to-html": {
      const buffer = await fileToBuffer(formData.get("file"));
      return { json: await convertDocxToHtml(buffer) };
    }

    case "word-to-pdf": {
      const file = formData.get("file");
      const buffer = await fileToBuffer(file);
      const bytes = await convertDocxToPdf(buffer);
      return {
        bytes, filename: buildDownloadName(fileName(file), "converted", "pdf"), contentType: "application/pdf",
        extraHeaders: sizeHeaders(buffer.byteLength, bytes.byteLength),
      };
    }

    case "pdf-to-word": {
      const file = formData.get("file");
      const buffer = await fileToBuffer(file);
      const bytes = await convertPdfToDocx(buffer);
      return {
        bytes, filename: buildDownloadName(fileName(file), "converted", "docx"), contentType: DOCX_CONTENT_TYPE,
        extraHeaders: sizeHeaders(buffer.byteLength, bytes.byteLength),
      };
    }

    case "pdf-protect": {
      const file = formData.get("file");
      const buffer = await fileToBuffer(file);
      if (!options.password || typeof options.password !== "string") throw new Error('options.password is required, e.g. {"password": "secret123"}');
      const bytes = await protectPdf(buffer, options.password);
      return {
        bytes, filename: buildDownloadName(fileName(file), "protected", "pdf"), contentType: "application/pdf",
        extraHeaders: sizeHeaders(buffer.byteLength, bytes.byteLength),
      };
    }

    case "pdf-unlock": {
      // password is optional here: a PDF can be restricted with only an
      // owner password (readable with no prompt, but edit/print/copy are
      // locked) — see isEncrypted()/unlockPdf's doc comment in
      // pdf-protect.ts. unlockPdf itself asks for one only if the file
      // actually needs it to open.
      const file = formData.get("file");
      const buffer = await fileToBuffer(file);
      const password = typeof options.password === "string" ? options.password : undefined;
      const bytes = await unlockPdf(buffer, password);
      return {
        bytes, filename: buildDownloadName(fileName(file), "unlocked", "pdf"), contentType: "application/pdf",
        extraHeaders: sizeHeaders(buffer.byteLength, bytes.byteLength),
      };
    }

    case "pdf-ocr": {
      const file = formData.get("file");
      const buffer = await fileToBuffer(file);
      const pages = Array.isArray(options.pages) && options.pages.length > 0 ? (options.pages as number[]) : undefined;
      const lang = typeof options.lang === "string" ? options.lang : undefined;
      const bytes = await ocrPdf(buffer, { pages, lang });
      return {
        bytes, filename: buildDownloadName(fileName(file), "ocr", "pdf"), contentType: "application/pdf",
        extraHeaders: sizeHeaders(buffer.byteLength, bytes.byteLength),
      };
    }

    case "audio-converter": {
      const file = formData.get("file");
      const buffer = await fileToBuffer(file);
      const format = ((options.format as string) ?? "mp3") as AudioFormat;
      const bytes = await convertAudio(buffer, file instanceof File ? file.name : undefined, format);
      return {
        bytes, filename: buildDownloadName(fileName(file), "converted", format), contentType: AUDIO_CONTENT_TYPE[format] ?? "audio/mpeg",
        extraHeaders: sizeHeaders(buffer.byteLength, bytes.byteLength),
      };
    }

    case "audio-watermark": {
      const mainFile = formData.get("file");
      const wmFile = formData.get("watermarkFile");
      const mainBuffer = await fileToBuffer(mainFile, "main track");
      const wmBuffer = await fileToBuffer(wmFile, "watermark clip");
      const bytes = await watermarkAudio(
        mainBuffer, mainFile instanceof File ? mainFile.name : undefined,
        wmBuffer, wmFile instanceof File ? wmFile.name : undefined,
        { volume: options.volume as number | undefined }
      );
      return {
        bytes, filename: buildDownloadName(fileName(mainFile), "watermarked", "mp3"), contentType: "audio/mpeg",
        extraHeaders: sizeHeaders(mainBuffer.byteLength, bytes.byteLength),
      };
    }

    default:
      throw new Error(`File handler for '${toolId}' is not implemented`);
  }
}
