"use client";

import { useRef, useState } from "react";
import { Tool } from "@/lib/tools";
import { FILE_TOOLS, type FileToolField } from "@/lib/file-tools";
import { Upload, Download, Loader2, FileText, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProgressSimulation, ProcessingPanel, SizeComparison } from "@/components/ProgressIndicator";

function safeJsonParse(text: string): Record<string, unknown> {
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

// Prefers the RFC 5987 filename*=UTF-8''... param (full fidelity for
// non-ASCII names) over the plain filename="..." fallback (ASCII-sanitized
// by the server for header safety).
function parseFilename(disposition: string): string | undefined {
  const star = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (star) {
    try {
      return decodeURIComponent(star[1]);
    } catch {
      // fall through to the plain param
    }
  }
  return /filename="([^"]+)"/.exec(disposition)?.[1];
}

interface FileToolInterfaceProps {
  tool: Tool;
}

// "2, 4, 7-9" -> [2, 4, 7, 8, 9] — a SET of pages, sorted + deduplicated.
// Order doesn't matter for "which pages to remove/extract".
function parsePageRange(input: string): number[] {
  const nums = new Set<number>();
  for (const part of input.split(",").map((s) => s.trim()).filter(Boolean)) {
    const rangeMatch = /^(\d+)\s*-\s*(\d+)$/.exec(part);
    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      for (let n = Math.min(start, end); n <= Math.max(start, end); n++) nums.add(n);
    } else if (/^\d+$/.test(part)) {
      nums.add(Number(part));
    }
  }
  return Array.from(nums).sort((a, b) => a - b);
}

// "3, 1, 2" -> [3, 1, 2] — a SEQUENCE, kept exactly as typed. Used for
// pdf-organize's new page order, where sorting would silently undo the
// user's reordering.
function parsePageOrder(input: string): number[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s))
    .map(Number);
}

function defaultFieldValues(fields: FileToolField[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const f of fields) {
    if (f.defaultValue !== undefined) values[f.name] = String(f.defaultValue);
  }
  return values;
}

export default function FileToolInterface({ tool }: FileToolInterfaceProps) {
  const config = FILE_TOOLS[tool.id];
  const [files, setFiles] = useState<File[]>([]);
  const [secondFile, setSecondFile] = useState<File | null>(null);
  const [isDraggingSecond, setIsDraggingSecond] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => defaultFieldValues(config.fields ?? []));
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"uploading" | "processing" | "success">("uploading");
  const { progress, setProgress, start, reset: resetProgress, stop: stopProgress } = useProgressSimulation();
  const [error, setError] = useState<string | null>(null);
  const [jsonResult, setJsonResult] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>("");
  const [sizeInfo, setSizeInfo] = useState<{ original: number; result: number } | null>(null);
  const dragCounter = useRef(0);
  const dragCounterSecond = useRef(0);

  function resetResults() {
    setError(null);
    setJsonResult(null);
    setSizeInfo(null);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
  }

  function addFiles(list: FileList | File[]) {
    const incoming = Array.from(list);
    if (incoming.length === 0) return;
    if (config.multiple) {
      setFiles((prev) => [...prev, ...incoming]);
    } else {
      setFiles(incoming.slice(0, 1));
    }
    resetResults();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = ""; // allow re-selecting the same file
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes("Files")) setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }

  function handleSecondFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) { setSecondFile(e.target.files[0]); resetResults(); }
    e.target.value = "";
  }

  function handleSecondDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterSecond.current++;
    if (e.dataTransfer.types.includes("Files")) setIsDraggingSecond(true);
  }

  function handleSecondDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterSecond.current--;
    if (dragCounterSecond.current <= 0) {
      dragCounterSecond.current = 0;
      setIsDraggingSecond(false);
    }
  }

  function handleSecondDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterSecond.current = 0;
    setIsDraggingSecond(false);
    if (e.dataTransfer.files?.[0]) { setSecondFile(e.dataTransfer.files[0]); resetResults(); }
  }

  function setField(name: string, value: string) {
    setFieldValues((prev) => ({ ...prev, [name]: value }));
  }

  function buildOptionsJson(): string | null {
    if (!config.fields || config.fields.length === 0) return null;
    const obj: Record<string, unknown> = {};
    for (const f of config.fields) {
      const raw = fieldValues[f.name];
      if (raw === undefined || raw === "") continue;
      if (f.type === "number") obj[f.name] = Number(raw);
      else if (f.type === "pageRange") obj[f.name] = parsePageRange(raw);
      else if (f.type === "pageOrder") obj[f.name] = parsePageOrder(raw);
      // <select> option values are always strings in the DOM, even when the
      // field declares numeric options (e.g. image-rotate's angle: 90/180/-90)
      // — without this, the tool handler's Number.isFinite() check sees the
      // string "90" and rejects it, even though pdf-rotate's angle % 360
      // happened to still work via implicit string-to-number coercion.
      else if (f.type === "select" && f.options?.every((o) => typeof o.value === "number")) obj[f.name] = Number(raw);
      else obj[f.name] = raw;
    }
    return Object.keys(obj).length > 0 ? JSON.stringify(obj) : null;
  }

  function missingRequiredField(): string | null {
    for (const f of config.fields ?? []) {
      if (f.required && !fieldValues[f.name]?.trim()) return f.label;
    }
    return null;
  }

  async function handleRun() {
    if (files.length === 0) { setError(`Choose ${config.acceptLabel} first`); return; }
    if (config.secondFileInput && !secondFile) { setError(`Choose ${config.secondFileInput.acceptLabel} first`); return; }
    const missing = missingRequiredField();
    if (missing) { setError(`"${missing}" is required`); return; }

    setLoading(true);
    setPhase("uploading");
    resetProgress();
    resetResults();

    const formData = new FormData();
    if (config.multiple) {
      files.forEach((f) => formData.append("files", f));
    } else {
      formData.append("file", files[0]);
    }
    if (config.secondFileInput && secondFile) {
      formData.append(config.secondFileInput.name, secondFile);
    }
    const optionsJson = buildOptionsJson();
    if (optionsJson) formData.append("options", optionsJson);

    // A fallback timer flips the label from "Uploading" to "Processing" even
    // if the browser never fires an upload-progress event (common for small
    // files sent in a single chunk) so the UI doesn't get stuck on "Uploading".
    const processingFallback = setTimeout(() => {
      setPhase("processing");
      start(20, 92);
    }, 350);

    try {
      const outcome = await new Promise<{ status: number; contentType: string; disposition: string; blob: Blob; originalSize: string | null; newSize: string | null }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/api/tools/${tool.id}`);
        xhr.responseType = "blob";
        xhr.upload.onprogress = (e) => {
          if (!e.lengthComputable || e.total <= 0) return;
          const uploadPct = (e.loaded / e.total) * 45;
          setProgress((p) => Math.max(p, uploadPct));
          if (e.loaded >= e.total) {
            clearTimeout(processingFallback);
            setPhase("processing");
            start(45, 92);
          }
        };
        xhr.onload = () => {
          resolve({
            status: xhr.status,
            contentType: xhr.getResponseHeader("content-type") ?? "",
            disposition: xhr.getResponseHeader("content-disposition") ?? "",
            blob: xhr.response as Blob,
            originalSize: xhr.getResponseHeader("x-original-size"),
            newSize: xhr.getResponseHeader("x-new-size"),
          });
        };
        xhr.onerror = () => reject(new Error("Network error — please try again"));
        xhr.send(formData);
      });

      clearTimeout(processingFallback);
      stopProgress();

      if (outcome.status < 200 || outcome.status >= 300) {
        const data = safeJsonParse(await outcome.blob.text());
        if (data.error === "premium_required" || data.error === "rate_limited") {
          setError(`${data.error === "premium_required" ? "🔒" : "⏱️"} ${data.message}`);
        } else {
          setError((data.error as string) || "Something went wrong");
        }
        return;
      }

      setProgress(100);
      setPhase("success");

      if (outcome.contentType.includes("application/json")) {
        const data = safeJsonParse(await outcome.blob.text());
        setJsonResult(JSON.stringify(data.result, null, 2));
      } else {
        setDownloadName(parseFilename(outcome.disposition) ?? `${tool.id}-result`);
        setDownloadUrl(URL.createObjectURL(outcome.blob));
        if (outcome.originalSize && outcome.newSize) {
          setSizeInfo({ original: Number(outcome.originalSize), result: Number(outcome.newSize) });
        }
      }

      // Let the success checkmark play before revealing the result panel.
      await new Promise((r) => setTimeout(r, 550));
    } catch (err) {
      clearTimeout(processingFallback);
      stopProgress();
      setError(err instanceof Error ? err.message : "Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        className="bg-white border border-gray-200 rounded-2xl p-6"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {config.secondFileInput && (
          <p className="text-xs font-medium text-gray-500 mb-3">Main track</p>
        )}
        <label
          className={cn(
            "flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-10 cursor-pointer transition-colors",
            isDragging ? "border-violet-500 bg-violet-50" : "border-gray-200 hover:border-violet-300 hover:bg-violet-50/30"
          )}
        >
          <Upload className={cn("w-6 h-6", isDragging ? "text-violet-500" : "text-gray-400")} />
          <span className="text-sm text-gray-600 font-medium">
            {isDragging ? "Drop to upload" : `Drop ${config.acceptLabel} here, or click to browse`}
          </span>
          <span className="text-xs text-gray-400">Max 10MB per file</span>
          <input
            type="file"
            accept={config.accept}
            multiple={config.multiple}
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {files.length > 0 && (
          <ul className="mt-4 space-y-2">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm">
                <span className="flex items-center gap-2 text-gray-700 truncate">
                  <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="truncate">{f.name}</span>
                  <span className="text-gray-400 text-xs shrink-0">({(f.size / 1024).toFixed(0)} KB)</span>
                </span>
                <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500 shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Second dropzone (e.g. audio-watermark's watermark clip) */}
      {config.secondFileInput && (
        <div
          className="bg-white border border-gray-200 rounded-2xl p-6"
          onDragEnter={handleSecondDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleSecondDragLeave}
          onDrop={handleSecondDrop}
        >
          <p className="text-xs font-medium text-gray-500 mb-3">{config.secondFileInput.label}</p>
          <label
            className={cn(
              "flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-10 cursor-pointer transition-colors",
              isDraggingSecond ? "border-violet-500 bg-violet-50" : "border-gray-200 hover:border-violet-300 hover:bg-violet-50/30"
            )}
          >
            <Upload className={cn("w-6 h-6", isDraggingSecond ? "text-violet-500" : "text-gray-400")} />
            <span className="text-sm text-gray-600 font-medium">
              {isDraggingSecond ? "Drop to upload" : `Drop ${config.secondFileInput.acceptLabel} here, or click to browse`}
            </span>
            <input type="file" accept={config.secondFileInput.accept} onChange={handleSecondFileChange} className="hidden" />
          </label>
          {secondFile && (
            <div className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm mt-4">
              <span className="flex items-center gap-2 text-gray-700 truncate">
                <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="truncate">{secondFile.name}</span>
                <span className="text-gray-400 text-xs shrink-0">({(secondFile.size / 1024).toFixed(0)} KB)</span>
              </span>
              <button onClick={() => setSecondFile(null)} className="text-gray-400 hover:text-red-500 shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Options form */}
      {config.fields && config.fields.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 grid sm:grid-cols-2 gap-4">
          {config.fields.map((f) => (
            <div key={f.name} className={cn(f.type === "text" && f.name.toLowerCase().includes("text") ? "sm:col-span-2" : "")}>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                {f.label}{f.required && <span className="text-red-500">*</span>}
              </label>
              {f.type === "select" ? (
                <select
                  value={fieldValues[f.name] ?? ""}
                  onChange={(e) => setField(f.name, e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-400 bg-white"
                >
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : f.type === "number" ? (
                <input
                  type="number"
                  value={fieldValues[f.name] ?? ""}
                  onChange={(e) => setField(f.name, e.target.value)}
                  min={f.min}
                  max={f.max}
                  step={f.step ?? 1}
                  placeholder={f.placeholder}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-400"
                />
              ) : (
                <input
                  type={f.type === "password" ? "password" : "text"}
                  value={fieldValues[f.name] ?? ""}
                  onChange={(e) => setField(f.name, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-400"
                />
              )}
              {f.helpText && (
                <p className="flex items-start gap-1 text-xs text-gray-400 mt-1">
                  <Info className="w-3 h-3 mt-0.5 shrink-0" /> {f.helpText}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Run button */}
      <button
        onClick={handleRun}
        disabled={loading}
        className={cn(
          "w-full py-3 px-6 rounded-xl font-semibold text-white transition-all",
          "bg-violet-600 hover:bg-violet-700 active:scale-[.99]",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          "flex items-center justify-center gap-2"
        )}
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> {phase === "uploading" ? "Uploading..." : phase === "success" ? "Done!" : "Processing..."}</>
        ) : (
          `Run — ${tool.name}`
        )}
      </button>

      {/* Progress animation (circular ring + linear bar) */}
      {loading && (
        <ProcessingPanel
          progress={progress}
          phaseLabel={phase === "uploading" ? "Uploading file..." : "Processing..."}
          success={phase === "success"}
        />
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
          {error}
          {error.includes("Pro") && (
            <a href="/pricing" className="block mt-2 text-violet-600 font-semibold hover:underline">
              Upgrade to Pro →
            </a>
          )}
        </div>
      )}

      {/* JSON result (e.g. metadata viewer) */}
      {jsonResult && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <span className="text-sm font-medium text-gray-600">Result</span>
          </div>
          <pre className="p-4 text-sm font-mono text-gray-800 overflow-x-auto whitespace-pre-wrap max-h-[400px] overflow-y-auto">
            {jsonResult}
          </pre>
        </div>
      )}

      {/* File download result */}
      {downloadUrl && (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center">
          <p className="text-sm text-green-800 mb-3">Done — your file is ready.</p>
          <a
            href={downloadUrl}
            download={downloadName}
            className="inline-flex items-center gap-2 bg-violet-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-violet-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download {downloadName}
          </a>
        </div>
      )}

      {/* Graphical before/after size comparison */}
      {sizeInfo && <SizeComparison originalBytes={sizeInfo.original} newBytes={sizeInfo.result} />}
    </div>
  );
}
