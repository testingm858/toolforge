// Shared config for file-upload tools (PDF manipulation, image editing,
// etc). Imported by both the API route (server, via file-dispatch.ts) and
// FileToolInterface (client) so the two stay in sync on which tools take a
// file upload instead of the generic textarea, and what form controls that
// upload's options should render as.
//
// Each tool declares its options as a list of typed fields rather than a
// raw JSON blob — the UI renders real inputs (number spinners, dropdowns,
// text fields) and assembles the JSON object for the API under the hood.

// "pageRange" is a SET of pages (sorted, deduplicated) — e.g. which pages to
// remove or extract, where order typing doesn't matter. "pageOrder" is a
// SEQUENCE — e.g. the new page order for pdf-organize — where "3, 1, 2"
// must stay exactly [3, 1, 2], not get sorted back to [1, 2, 3].
export type FileToolFieldType = "number" | "text" | "password" | "select" | "pageRange" | "pageOrder";

export interface FileToolFieldOption {
  label: string;
  value: string | number;
}

export interface FileToolField {
  name: string;
  label: string;
  type: FileToolFieldType;
  defaultValue?: string | number;
  options?: FileToolFieldOption[]; // for "select"
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
}

// For tools needing TWO distinct files (not N copies of the same thing —
// see pdf-merge/jpg-to-pdf's "multiple" — but e.g. a main track + a
// separate watermark clip). Sent under its own FormData field name.
export interface SecondFileInput {
  name: string;
  label: string;
  accept: string;
  acceptLabel: string;
}

export interface FileToolConfig {
  multiple: boolean;
  accept: string;
  acceptLabel: string; // human-readable, shown in the dropzone
  fields?: FileToolField[];
  secondFileInput?: SecondFileInput;
  outputIsFile: boolean; // false = tool returns JSON (e.g. reading metadata)
}

export const FILE_TOOLS: Record<string, FileToolConfig> = {
  "pdf-merge": {
    multiple: true, accept: "application/pdf", acceptLabel: "PDF files", outputIsFile: true,
  },
  "pdf-rotate": {
    multiple: false, accept: "application/pdf", acceptLabel: "a PDF file", outputIsFile: true,
    fields: [
      { name: "angle", label: "Rotate by", type: "select", defaultValue: 90, options: [
        { label: "90° clockwise", value: 90 },
        { label: "180°", value: 180 },
        { label: "90° counter-clockwise", value: 270 },
      ] },
    ],
  },
  "pdf-watermark": {
    multiple: false, accept: "application/pdf", acceptLabel: "a PDF file", outputIsFile: true,
    fields: [
      { name: "text", label: "Watermark text", type: "text", placeholder: "CONFIDENTIAL", required: true },
      { name: "opacity", label: "Opacity", type: "number", defaultValue: 0.25, min: 0.05, max: 1, step: 0.05 },
    ],
  },
  "pdf-page-numbers": {
    multiple: false, accept: "application/pdf", acceptLabel: "a PDF file", outputIsFile: true,
    fields: [
      { name: "startAt", label: "Start numbering at", type: "number", defaultValue: 1, min: 1 },
      { name: "position", label: "Position", type: "select", defaultValue: "bottom-center", options: [
        { label: "Bottom center", value: "bottom-center" },
        { label: "Bottom left", value: "bottom-left" },
        { label: "Bottom right", value: "bottom-right" },
      ] },
    ],
  },
  "pdf-remove-pages": {
    multiple: false, accept: "application/pdf", acceptLabel: "a PDF file", outputIsFile: true,
    fields: [
      { name: "pages", label: "Pages to remove", type: "pageRange", placeholder: "e.g. 2, 4, 7-9", required: true, helpText: "Comma-separated page numbers or ranges" },
    ],
  },
  "pdf-extract-pages": {
    multiple: false, accept: "application/pdf", acceptLabel: "a PDF file", outputIsFile: true,
    fields: [
      { name: "pages", label: "Pages to extract", type: "pageRange", placeholder: "e.g. 1, 3, 5-8", required: true, helpText: "Comma-separated page numbers or ranges" },
    ],
  },
  "pdf-split": {
    multiple: false, accept: "application/pdf", acceptLabel: "a PDF file", outputIsFile: true,
    fields: [
      { name: "pages", label: "Pages to split out", type: "pageRange", placeholder: "e.g. 1-3", required: true, helpText: "Comma-separated page numbers or ranges" },
    ],
  },
  "pdf-organize": {
    multiple: false, accept: "application/pdf", acceptLabel: "a PDF file", outputIsFile: true,
    fields: [
      { name: "order", label: "New page order", type: "pageOrder", placeholder: "e.g. 3, 1, 2", required: true, helpText: "List every page once, in the new order" },
    ],
  },
  "pdf-to-jpg": {
    multiple: false, accept: "application/pdf", acceptLabel: "a PDF file", outputIsFile: true,
    fields: [
      { name: "pages", label: "Pages to convert (optional)", type: "pageRange", placeholder: "e.g. 1, 3, 5-8 — leave blank for all pages", helpText: "Comma-separated page numbers or ranges. Multiple pages download as a .zip." },
    ],
  },
  "pdf-metadata": {
    multiple: false, accept: "application/pdf", acceptLabel: "a PDF file", outputIsFile: false,
    fields: [
      { name: "title", label: "Title", type: "text", placeholder: "Leave blank to just view current metadata" },
      { name: "author", label: "Author", type: "text" },
      { name: "subject", label: "Subject", type: "text" },
      { name: "keywords", label: "Keywords", type: "text", placeholder: "comma-separated" },
    ],
  },
  "pdf-compress": {
    multiple: false, accept: "application/pdf", acceptLabel: "a PDF file", outputIsFile: true,
  },
  "pdf-sign": {
    multiple: false, accept: "application/pdf", acceptLabel: "a PDF file", outputIsFile: true,
    fields: [
      { name: "signatureText", label: "Signature text", type: "text", placeholder: "Jane Doe", required: true },
      { name: "page", label: "Page number", type: "number", min: 1, placeholder: "Last page by default" },
    ],
  },
  "jpg-to-pdf": {
    multiple: true, accept: "image/jpeg,image/png", acceptLabel: "JPG or PNG images", outputIsFile: true,
  },

  "image-compress": {
    multiple: false, accept: "image/*", acceptLabel: "an image", outputIsFile: true,
    fields: [
      { name: "quality", label: "Quality", type: "number", defaultValue: 40, min: 1, max: 100, helpText: "Defaults to maximum compression. Raise this if the result looks too lossy." },
    ],
  },
  "image-resize": {
    multiple: false, accept: "image/*", acceptLabel: "an image", outputIsFile: true,
    fields: [
      { name: "width", label: "Width (px)", type: "number", min: 1, max: 10000, placeholder: "800" },
      { name: "height", label: "Height (px)", type: "number", min: 1, max: 10000, placeholder: "600" },
      { name: "fit", label: "Fit", type: "select", defaultValue: "cover", options: [
        { label: "Cover (crop to fill)", value: "cover" },
        { label: "Contain (fit within)", value: "contain" },
        { label: "Fill (stretch)", value: "fill" },
        { label: "Inside (shrink only)", value: "inside" },
        { label: "Outside (grow only)", value: "outside" },
      ] },
    ],
  },
  "image-crop": {
    multiple: false, accept: "image/*", acceptLabel: "an image", outputIsFile: true,
    fields: [
      { name: "left", label: "Left (px)", type: "number", defaultValue: 0, min: 0 },
      { name: "top", label: "Top (px)", type: "number", defaultValue: 0, min: 0 },
      { name: "width", label: "Width (px)", type: "number", min: 1, required: true, placeholder: "300" },
      { name: "height", label: "Height (px)", type: "number", min: 1, required: true, placeholder: "300" },
    ],
  },
  "image-rotate": {
    multiple: false, accept: "image/*", acceptLabel: "an image", outputIsFile: true,
    fields: [
      { name: "angle", label: "Rotate by", type: "select", defaultValue: 90, options: [
        { label: "90° clockwise", value: 90 },
        { label: "180°", value: 180 },
        { label: "90° counter-clockwise", value: -90 },
      ] },
    ],
  },
  "image-convert": {
    multiple: false, accept: "image/*", acceptLabel: "an image", outputIsFile: true,
    fields: [
      { name: "format", label: "Convert to", type: "select", defaultValue: "png", options: [
        { label: "PNG", value: "png" },
        { label: "JPEG", value: "jpeg" },
        { label: "WebP", value: "webp" },
        { label: "AVIF", value: "avif" },
      ] },
    ],
  },
  "svg-converter": {
    multiple: false, accept: "image/svg+xml", acceptLabel: "an SVG file", outputIsFile: true,
    fields: [
      { name: "format", label: "Convert to", type: "select", defaultValue: "png", options: [
        { label: "PNG", value: "png" },
        { label: "JPEG", value: "jpeg" },
        { label: "WebP", value: "webp" },
      ] },
      { name: "width", label: "Width (px, optional)", type: "number", min: 1, max: 10000, placeholder: "512" },
    ],
  },
  "image-metadata": {
    multiple: false, accept: "image/*", acceptLabel: "an image", outputIsFile: false,
  },
  "image-metadata-remove": {
    multiple: false, accept: "image/*", acceptLabel: "an image", outputIsFile: true,
  },
  "color-picker": {
    multiple: false, accept: "image/*", acceptLabel: "an image", outputIsFile: false,
    fields: [
      { name: "x", label: "X coordinate (px)", type: "number", defaultValue: 0, min: 0, required: true },
      { name: "y", label: "Y coordinate (px)", type: "number", defaultValue: 0, min: 0, required: true },
    ],
  },
  "image-to-base64": {
    multiple: false, accept: "image/*", acceptLabel: "an image", outputIsFile: false,
  },
  "favicon-generator": {
    multiple: false, accept: "image/*", acceptLabel: "a square logo/image", outputIsFile: true,
  },
  "word-to-html": {
    multiple: false, accept: ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document", acceptLabel: "a .docx file", outputIsFile: false,
  },
  "word-to-pdf": {
    multiple: false, accept: ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document", acceptLabel: "a .docx file", outputIsFile: true,
  },
  "pdf-to-word": {
    multiple: false, accept: "application/pdf", acceptLabel: "a PDF file", outputIsFile: true,
  },
  "pdf-protect": {
    multiple: false, accept: "application/pdf", acceptLabel: "a PDF file", outputIsFile: true,
    fields: [
      { name: "password", label: "Password", type: "password", placeholder: "Choose a password", required: true },
    ],
  },
  "pdf-unlock": {
    multiple: false, accept: "application/pdf", acceptLabel: "a password-protected or restricted PDF file", outputIsFile: true,
    fields: [
      { name: "password", label: "Password (if the PDF requires one to open)", type: "password", placeholder: "Leave blank if it only restricts printing/editing", helpText: "Some restricted PDFs open without a password — leave this blank for those" },
    ],
  },
  "pdf-ocr": {
    multiple: false, accept: "application/pdf", acceptLabel: "a scanned or image-based PDF file", outputIsFile: true,
    fields: [
      // Kept in sync by hand with SUPPORTED_OCR_LANGUAGES in
      // src/tools/pdf/pdf-ocr.ts — that module can't be imported here since
      // this file is also loaded client-side and pdf-ocr.ts pulls in
      // server-only packages (tesseract.js, node:path).
      { name: "lang", label: "Document language", type: "select", defaultValue: "eng", options: [
        { label: "English", value: "eng" }, { label: "Spanish", value: "spa" }, { label: "French", value: "fra" },
        { label: "German", value: "deu" }, { label: "Italian", value: "ita" }, { label: "Portuguese", value: "por" },
        { label: "Dutch", value: "nld" }, { label: "Russian", value: "rus" },
        { label: "Chinese (Simplified)", value: "chi_sim" }, { label: "Chinese (Traditional)", value: "chi_tra" },
        { label: "Japanese", value: "jpn" }, { label: "Korean", value: "kor" },
        { label: "Hindi", value: "hin" }, { label: "Arabic", value: "ara" },
      ] },
      { name: "pages", label: "Pages to OCR (optional)", type: "pageRange", placeholder: "e.g. 1, 3, 5-8 — leave blank for all pages", helpText: "Comma-separated page numbers or ranges" },
    ],
  },

  "audio-converter": {
    multiple: false, accept: "audio/*", acceptLabel: "an audio file", outputIsFile: true,
    fields: [
      { name: "format", label: "Convert to", type: "select", defaultValue: "mp3", options: [
        { label: "MP3", value: "mp3" }, { label: "WAV", value: "wav" }, { label: "OGG", value: "ogg" }, { label: "FLAC", value: "flac" },
      ] },
    ],
  },
  "audio-watermark": {
    multiple: false, accept: "audio/*", acceptLabel: "your audio track", outputIsFile: true,
    secondFileInput: { name: "watermarkFile", label: "Watermark clip", accept: "audio/*", acceptLabel: "a short watermark clip" },
    fields: [
      { name: "volume", label: "Watermark volume", type: "number", defaultValue: 0.35, min: 0, max: 1, step: 0.05, helpText: "0 = silent, 1 = full volume, relative to the main track" },
    ],
  },
};

export function isFileTool(toolId: string): boolean {
  return toolId in FILE_TOOLS;
}
