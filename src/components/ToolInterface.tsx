"use client";

import { useState } from "react";
import { Tool } from "@/lib/tools";
import { Copy, Download, RotateCcw, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { TOOL_FIELDS, hasFormFields, type ToolField } from "@/lib/text-tool-fields";
import { useProgressSimulation, ProcessingPanel } from "@/components/ProgressIndicator";

interface ToolInterfaceProps {
  tool: Tool;
}

// Tools with no meaningful input — clicking Run should work even with an
// empty textarea, since these just generate something (an ID, a username)
// rather than transform typed text. password-generator now has its own
// form fields (see text-tool-fields.ts) so it goes through the isForm path
// instead and doesn't need to be listed here.
const NO_INPUT_REQUIRED = new Set(["uuid-generator", "username-generator"]);

function defaultFieldValues(fields: ToolField[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const f of fields) {
    if (f.defaultValue !== undefined) values[f.name] = String(f.defaultValue);
  }
  return values;
}

export default function ToolInterface({ tool }: ToolInterfaceProps) {
  const isForm = hasFormFields(tool.id);
  const fields = TOOL_FIELDS[tool.id] ?? [];
  const [input, setInput] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => defaultFieldValues(fields));
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { progress, start, finish, reset: resetProgress } = useProgressSimulation();
  const [copied, setCopied] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileFilename, setFileFilename] = useState("");
  const [fileIsImage, setFileIsImage] = useState(false);

  function setField(name: string, value: string) {
    setFieldValues((prev) => ({ ...prev, [name]: value }));
  }

  function isFieldVisible(f: ToolField): boolean {
    if (!f.showIf) return true;
    return (fieldValues[f.showIf.field] ?? "") === String(f.showIf.equals);
  }

  function buildInputFromFields(): string {
    const obj: Record<string, unknown> = {};
    for (const f of fields) {
      if (!isFieldVisible(f)) continue;
      const raw = fieldValues[f.name];
      if (raw === undefined || raw === "") continue;
      if (f.type === "number") obj[f.name] = Number(raw);
      else if (f.type === "checkbox") obj[f.name] = raw === "true";
      else if (f.type === "multiselect") obj[f.name] = raw.split(",").filter(Boolean);
      else obj[f.name] = raw;
    }
    return JSON.stringify(obj);
  }

  function missingRequiredField(): string | null {
    for (const f of fields) {
      if (f.required && isFieldVisible(f) && !fieldValues[f.name]?.trim()) return f.label;
    }
    return null;
  }

  async function handleRun() {
    if (isForm) {
      const missing = missingRequiredField();
      if (missing) { setError(`"${missing}" is required`); return; }
    } else if (!input.trim() && !NO_INPUT_REQUIRED.has(tool.id)) {
      return;
    }
    setLoading(true);
    setSuccess(false);
    setError(null);
    setResult(null);
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFileUrl(null);
    start(8, 90);

    try {
      const effectiveInput = isForm ? buildInputFromFields() : input;
      const res = await fetch(`/api/tools/${tool.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: effectiveInput }),
      });

      const contentType = res.headers.get("content-type") ?? "";

      // Some tools take text/JSON input but produce a downloadable file
      // (qr-generator, base64-to-image, invoice-generator, ...) — those come
      // back as a raw binary body instead of JSON.
      if (res.ok && !contentType.includes("application/json")) {
        const blob = await res.blob();
        const disposition = res.headers.get("content-disposition") ?? "";
        const match = /filename="([^"]+)"/.exec(disposition);
        setFileFilename(match?.[1] ?? `${tool.id}-result`);
        setFileIsImage(contentType.startsWith("image/"));
        setFileUrl(URL.createObjectURL(blob));
        finish();
        setSuccess(true);
        await new Promise((r) => setTimeout(r, 550));
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "premium_required") {
          setError(`🔒 ${data.message}`);
        } else if (data.error === "rate_limited") {
          setError(`⏱️ ${data.message}`);
        } else if (data.error === "insufficient_credits") {
          setError(`⚡ ${data.message}`);
        } else {
          // Errors thrown inside a tool handler come back nested as
          // { result: { error: "..." } } rather than a top-level "error".
          setError(data.error || data.result?.error || "Something went wrong");
        }
        return;
      }

      const r = data.result;
      setResult(typeof r === "string" ? r : JSON.stringify(r, null, 2));
      finish();
      setSuccess(true);
      await new Promise((r) => setTimeout(r, 550));
    } catch {
      setError("Network error — please try again");
    } finally {
      resetProgress();
      setLoading(false);
    }
  }

  async function copyResult() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadResult() {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tool.id}-result.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const getInputLabel = () => {
    const labels: Record<string, string> = {
      "json-formatter": "Paste your JSON here",
      "base64-encoder": "Enter text to encode / Base64 to decode",
      "url-encoder": "Enter URL or encoded string",
      "uuid-generator": 'Click "Run" to generate UUIDs',
      "hash-generator": "Enter text to hash",
      "jwt-decoder": "Paste your JWT token",
      "password-generator": 'Click "Run" to generate passwords',
      "case-converter": "Enter your text",
      "slug-generator": "Enter text to convert to slug",
      "word-counter": "Paste or type your text here",
      "bmi-calculator": 'Enter JSON: {"weight": 70, "height": 175, "unit": "metric"}',
      "loan-calculator": 'Enter JSON: {"principal": 100000, "rate": 8.5, "months": 60}',
      "mortgage-calculator": 'Enter JSON: {"homePrice": 400000, "downPaymentPct": 20, "rate": 6.5, "years": 30}',
      "hex-to-rgb": "Enter HEX color (e.g. #6d28d9)",
      "color-palette": "Enter HEX color to generate palette",
      "rgb-to-hex": 'Enter JSON: {"r": 109, "g": 40, "b": 217}',
      "meta-tag-generator": 'JSON: {"title": "...", "description": "...", "keywords": "..."}',
      "og-generator": 'JSON: {"title": "...", "description": "...", "image": "...", "url": "..."}',
      "schema-generator": 'JSON: {"type": "Product", "data": { "name": "..." }}',
      "robots-txt": 'JSON: {"allowAll": true, "disallowPaths": ["/admin"], "sitemapUrl": "https://example.com/sitemap.xml"}',

      "xml-formatter": "Paste your XML here",
      "html-formatter": "Paste your HTML here",
      "html-minifier": "Paste your HTML here",
      "css-formatter": "Paste your CSS here",
      "css-minifier": "Paste your CSS here",
      "js-beautifier": "Paste your JavaScript here",
      "js-minifier": "Paste your JavaScript here",
      "sql-formatter": "Paste your SQL query here",
      "csv-to-json": "Paste CSV data here (first row = headers)",
      "json-to-csv": "Paste a JSON array of objects here",
      "markdown-preview": "Paste your Markdown here",
      "markdown-convert": "Paste your Markdown here",
      "regex-tester": 'Enter JSON: {"pattern": "\\\\d+", "flags": "g", "testString": "order 42, item 7"}',
      "jwt-encoder": 'Enter JSON: {"payload": {"sub": "user123"}, "secret": "my-secret", "expiresInSeconds": 3600}',
      "lorem-ipsum": 'Enter JSON: {"count": 3, "unit": "paragraphs"}',
      "diff-checker": 'Enter JSON: {"textA": "line1\\nline2", "textB": "line1\\nline3"}',
      "cron-generator": "Enter a cron expression (e.g. */15 * * * *)",
      "gitignore-generator": 'Enter JSON: {"stacks": ["node", "macos"]}',
      "htaccess-generator": 'Enter JSON: {"forceHttps": true, "wwwRedirect": "add"}',

      "remove-duplicates": "Paste text — one item per line",
      "remove-spaces": "Paste text with extra whitespace",
      "sort-text": "Paste text — one item per line",
      "reverse-text": "Enter text to reverse",
      "username-generator": 'Click "Run" to generate usernames',
      "contract-builder": 'Enter JSON: {"type": "nda", "partyA": "Acme Inc.", "partyB": "Jane Doe"}',

      "age-calculator": 'Enter JSON: {"birthDate": "1990-05-20"}',
      "gst-calculator": 'Enter JSON: {"amount": 1000, "rate": 18, "mode": "exclusive"}',
      "profit-calculator": 'Enter JSON: {"revenue": 5000, "cost": 3000}',
      "percentage-calculator": 'Enter JSON: {"op": "of", "a": 20, "b": 150}',
      "timezone-calculator": 'Enter JSON: {"dateTimeIso": "2026-07-15T14:00:00Z", "fromZone": "UTC", "toZone": "America/New_York"}',
      "pregnancy-calculator": 'Enter JSON: {"lastPeriodDate": "2026-01-01"}',
      "calorie-calculator": 'Enter JSON: {"weightKg": 70, "heightCm": 175, "age": 30, "sex": "male", "activityLevel": "moderate"}',
      "bmr-calculator": 'Enter JSON: {"weightKg": 70, "heightCm": 175, "age": 30, "sex": "male"}',
      "fuel-calculator": 'Enter JSON: {"distanceKm": 500, "fuelEfficiencyKmPerL": 14, "pricePerLiter": 1.6}',
      "roi-calculator": 'Enter JSON: {"gain": 12000, "cost": 10000}',
      "mrr-calculator": 'Enter JSON: {"customers": [{"plan": 29, "count": 40}], "churnedMrr": 100, "newMrr": 500}',
      "meeting-cost": 'Enter JSON: {"attendees": 6, "avgHourlySalary": 60, "durationMinutes": 45}',

      "gradient-generator": 'Enter JSON: {"color1": "#7c3aed", "color2": "#ec4899", "angle": 135}',
      "box-shadow": 'Enter JSON: {"offsetX": 0, "offsetY": 4, "blur": 12, "spread": 0, "color": "rgba(0,0,0,0.25)"}',
      "button-generator": 'Enter JSON: {"bg": "#7c3aed", "color": "#ffffff"}',
      "animation-generator": 'Enter JSON: {"name": "fadeIn", "type": "fade", "durationSeconds": 0.6}',
      "grid-generator": 'Enter JSON: {"columns": 3, "rows": 2, "gap": 16}',
      "flexbox-generator": 'Enter JSON: {"direction": "row", "justify": "center", "align": "center"}',
      "svg-blob-generator": 'Enter JSON: {"size": 200, "complexity": 6, "color": "#7c3aed"}',

      "sitemap-generator": 'Enter JSON: {"urls": [{"loc": "https://example.com/"}]}',
      "canonical-url": "Enter the canonical URL",
      "twitter-card": 'Enter JSON: {"title": "...", "description": "...", "image": "https://..."}',
      "hreflang-generator": 'Enter JSON: {"pages": [{"lang": "en", "url": "https://example.com/en"}]}',
      "keyword-density": 'Enter JSON: {"text": "...", "targetKeyword": "seo tools"}',
      "html-encode": "Enter text with special characters (< > & \" ')",
      "http-header-checker": "Enter a URL (e.g. https://example.com)",
      "redirect-checker": "Enter a URL (e.g. https://example.com)",

      "qr-generator": 'Enter JSON: {"text": "https://example.com", "size": 300}',
      "base64-to-image": "Paste a base64 data URL or raw base64 string",
      "barcode-generator": 'Enter JSON: {"text": "012345678905", "type": "code128"}',
      "yaml-formatter": "Paste your YAML here",
      "invoice-generator": 'Enter JSON — see placeholder for the shape',
      "resume-builder": 'Enter JSON — see placeholder for the shape',
    };
    if (labels[tool.id]) return labels[tool.id];
    if (tool.category.startsWith("ai-")) {
      return "Describe what you need in plain text, or paste JSON for full control (see example below)";
    }
    return "Enter input";
  };

  const getPlaceholder = () => {
    const ph: Record<string, string> = {
      "json-formatter": '{\n  "name": "John",\n  "age": 30\n}',
      "bmi-calculator": '{"weight": 70, "height": 175, "unit": "metric"}',
      "loan-calculator": '{"principal": 100000, "rate": 8.5, "months": 60}',
      "mortgage-calculator": '{"homePrice": 400000, "downPaymentPct": 20, "rate": 6.5, "years": 30}',
      "hex-to-rgb": "#6d28d9",
      "rgb-to-hex": '{"r": 109, "g": 40, "b": 217}',
      "meta-tag-generator": '{"title": "My Page", "description": "..."}',
      "og-generator": '{"title": "My Page", "description": "...", "image": "https://..."}',
      "schema-generator": '{"type": "Product", "data": {"name": "..."}}',
      "robots-txt": '{"allowAll": true, "disallowPaths": ["/admin"]}',

      "regex-tester": '{"pattern": "\\\\d+", "flags": "g", "testString": "order 42, item 7"}',
      "jwt-encoder": '{"payload": {"sub": "user123"}, "secret": "my-secret", "expiresInSeconds": 3600}',
      "lorem-ipsum": '{"count": 3, "unit": "paragraphs"}',
      "diff-checker": '{"textA": "line1\\nline2", "textB": "line1\\nline3"}',
      "cron-generator": "*/15 * * * *",
      "gitignore-generator": '{"stacks": ["node", "macos"]}',
      "htaccess-generator": '{"forceHttps": true, "wwwRedirect": "add"}',
      "contract-builder": '{"type": "nda", "partyA": "Acme Inc.", "partyB": "Jane Doe"}',

      "age-calculator": '{"birthDate": "1990-05-20"}',
      "gst-calculator": '{"amount": 1000, "rate": 18, "mode": "exclusive"}',
      "profit-calculator": '{"revenue": 5000, "cost": 3000}',
      "percentage-calculator": '{"op": "of", "a": 20, "b": 150}',
      "timezone-calculator": '{"dateTimeIso": "2026-07-15T14:00:00Z", "fromZone": "UTC", "toZone": "America/New_York"}',
      "pregnancy-calculator": '{"lastPeriodDate": "2026-01-01"}',
      "calorie-calculator": '{"weightKg": 70, "heightCm": 175, "age": 30, "sex": "male", "activityLevel": "moderate"}',
      "bmr-calculator": '{"weightKg": 70, "heightCm": 175, "age": 30, "sex": "male"}',
      "fuel-calculator": '{"distanceKm": 500, "fuelEfficiencyKmPerL": 14, "pricePerLiter": 1.6}',
      "roi-calculator": '{"gain": 12000, "cost": 10000}',
      "mrr-calculator": '{"customers": [{"plan": 29, "count": 40}], "churnedMrr": 100, "newMrr": 500}',
      "meeting-cost": '{"attendees": 6, "avgHourlySalary": 60, "durationMinutes": 45}',

      "gradient-generator": '{"color1": "#7c3aed", "color2": "#ec4899", "angle": 135}',
      "box-shadow": '{"offsetX": 0, "offsetY": 4, "blur": 12, "spread": 0, "color": "rgba(0,0,0,0.25)"}',
      "button-generator": '{"bg": "#7c3aed", "color": "#ffffff"}',
      "animation-generator": '{"name": "fadeIn", "type": "fade", "durationSeconds": 0.6}',
      "grid-generator": '{"columns": 3, "rows": 2, "gap": 16}',
      "flexbox-generator": '{"direction": "row", "justify": "center", "align": "center"}',
      "svg-blob-generator": '{"size": 200, "complexity": 6, "color": "#7c3aed"}',

      "sitemap-generator": '{"urls": [{"loc": "https://example.com/"}]}',
      "canonical-url": "https://example.com/page",
      "twitter-card": '{"title": "...", "description": "...", "image": "https://..."}',
      "hreflang-generator": '{"pages": [{"lang": "en", "url": "https://example.com/en"}]}',
      "keyword-density": '{"text": "...", "targetKeyword": "seo tools"}',
      "http-header-checker": "https://example.com",
      "redirect-checker": "https://example.com",

      "qr-generator": '{"text": "https://example.com"}',
      "base64-to-image": "data:image/png;base64,iVBORw0KGgo...",
      "barcode-generator": '{"text": "012345678905", "type": "code128"}',
      "invoice-generator": '{\n  "from": {"name": "Acme Inc.", "email": "billing@acme.com"},\n  "to": {"name": "Jane Doe", "email": "jane@example.com"},\n  "items": [{"description": "Design work", "quantity": 10, "unitPrice": 75}],\n  "taxRatePct": 8.5\n}',
      "resume-builder": '{\n  "name": "Jane Doe",\n  "title": "Product Designer",\n  "email": "jane@example.com",\n  "summary": "Product designer with 6 years of experience...",\n  "experience": [{"title": "Senior Designer", "company": "Acme Inc.", "dates": "2022–Present", "bullets": ["Led redesign of core product"]}],\n  "education": [{"degree": "BFA Design", "school": "State University", "dates": "2014–2018"}],\n  "skills": ["Figma", "User Research", "Prototyping"]\n}',

      "ai-blog-writer": 'Type a topic, or: {"topic": "...", "keywords": "...", "tone": "...", "wordCount": 800}',
      "ai-content-repurposer": 'Type content, or: {"content": "...", "formats": ["tweet", "LinkedIn post"]}',
      "ai-cold-email": 'Type a product, or: {"product": "...", "targetAudience": "...", "painPoint": "..."}',
      "ai-product-description": 'Type a product name, or: {"productName": "...", "features": "...", "tone": "..."}',
      "ai-job-description": 'Type a job title, or: {"jobTitle": "...", "company": "...", "responsibilities": "..."}',
      "ai-ad-copy": 'Type a product, or: {"product": "...", "platform": "Google Ads", "tone": "..."}',
      "ai-youtube-script": 'Type a topic, or: {"topic": "...", "duration": "5-8 minutes", "style": "..."}',
      "ai-newsletter": 'Type a topic, or: {"topic": "...", "audience": "...", "tone": "..."}',
      "ai-linkedin-post": 'Type a topic, or: {"topic": "...", "tone": "..."}',
      "ai-twitter-thread": 'Type a topic, or: {"topic": "...", "tweetCount": 6}',
      "ai-paraphraser": 'Paste text, or: {"text": "...", "style": "more concise"}',
      "ai-grammar-checker": "Paste the text you want checked",
      "ai-summarizer": 'Paste text, or: {"text": "...", "length": "3-5 sentences"}',
      "ai-cover-letter": 'Type a job title, or: {"jobTitle": "...", "company": "...", "background": "..."}',
      "ai-resume-reviewer": "Paste your resume text",
      "ai-proposal-writer": 'Type a project name, or: {"projectName": "...", "client": "...", "scope": "..."}',
      "ai-press-release": 'Type an announcement, or: {"announcement": "...", "company": "..."}',
      "ai-faq-generator": 'Type a topic, or: {"topic": "...", "count": 8}',
      "ai-meta-description": 'Type a page title, or: {"pageTitle": "...", "pageContent": "..."}',
      "ai-title-generator": 'Type a topic, or: {"topic": "...", "count": 8}',
      "ai-email-subject": 'Type a subject line, or: {"subjectLine": "...", "context": "..."}',
      "ai-ab-copy": 'Paste original copy, or: {"original": "...", "variations": 4}',
      "ai-caption-generator": 'Describe the image, or: {"description": "...", "platform": "Instagram"}',
      "ai-task-prioritizer": "Paste your task list, one per line",
      "ai-email-sequence": 'Type a goal, or: {"goal": "...", "emailCount": 4}',
      "ai-outreach-generator": 'Describe the prospect, or: {"prospect": "...", "context": "..."}',
      "ai-language-detector": "Paste any text",
      "ai-sentiment-analyzer": "Paste any text",
      "ai-csv-analyzer": 'Paste CSV data, or: {"csvData": "...", "question": "..."}',
      "ai-report-generator": "Paste your raw data or notes",
      "ai-image-generator": 'Type a description, or: {"prompt": "...", "size": "1024x1024"}',
      "ai-logo-generator": 'Type a description, or: {"prompt": "...", "size": "1024x1024"}',
      "ai-chatbot-builder": 'Describe your business/website, or: {"purpose": "...", "tone": "..."}',
      "ai-support-bot": 'Describe your product, or: {"product": "...", "commonIssues": "..."}',
      "ai-faq-chatbot": "Paste your site/FAQ content",
      "ai-slack-bot": 'Describe the bot, or: {"purpose": "...", "platform": "Slack"}',
      "ai-social-scheduler": 'Type a topic, or: {"topic": "...", "platforms": "...", "count": 7}',
    };
    return ph[tool.id] ?? "";
  };

  function handleClear() {
    setInput("");
    setFieldValues(defaultFieldValues(fields));
    setResult(null);
    setError(null);
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFileUrl(null);
  }

  return (
    <div className="space-y-4">
      {isForm ? (
        /* Form-based input */
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <span className="text-sm font-medium text-gray-600">{tool.name} details</span>
            <button onClick={handleClear} className="text-gray-400 hover:text-gray-600 transition-colors" title="Clear">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5 grid sm:grid-cols-2 gap-4">
            {fields.filter(isFieldVisible).map((f) => (
              <div key={f.name} className={cn(f.type === "textarea" ? "sm:col-span-2" : "")}>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                  {f.type === "checkbox" ? null : (
                    <>{f.label}{f.required && <span className="text-red-500">*</span>}</>
                  )}
                </label>
                {f.type === "select" ? (
                  <select
                    value={fieldValues[f.name] ?? ""}
                    onChange={(e) => setField(f.name, e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-400 bg-white"
                  >
                    {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : f.type === "number" ? (
                  <input
                    type="number" value={fieldValues[f.name] ?? ""} onChange={(e) => setField(f.name, e.target.value)}
                    min={f.min} max={f.max} step={f.step ?? 1} placeholder={f.placeholder}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-400"
                  />
                ) : f.type === "date" ? (
                  <input
                    type="date" value={fieldValues[f.name] ?? ""} onChange={(e) => setField(f.name, e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-400"
                  />
                ) : f.type === "color" ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="color" value={fieldValues[f.name] ?? "#000000"} onChange={(e) => setField(f.name, e.target.value)}
                      className="w-10 h-9 border border-gray-200 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text" value={fieldValues[f.name] ?? ""} onChange={(e) => setField(f.name, e.target.value)}
                      className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-400 font-mono"
                    />
                  </div>
                ) : f.type === "checkbox" ? (
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox" checked={fieldValues[f.name] === "true"}
                      onChange={(e) => setField(f.name, e.target.checked ? "true" : "false")}
                      className="w-4 h-4 accent-violet-600"
                    />
                    {f.label}
                  </label>
                ) : f.type === "multiselect" ? (
                  <div className="flex flex-wrap gap-2">
                    {f.options?.map((o) => {
                      const selected = (fieldValues[f.name] ?? "").split(",").filter(Boolean);
                      const isChecked = selected.includes(String(o.value));
                      return (
                        <label key={o.value} className={cn(
                          "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors",
                          isChecked ? "bg-violet-50 border-violet-300 text-violet-700" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                        )}>
                          <input
                            type="checkbox" checked={isChecked} className="hidden"
                            onChange={() => {
                              const next = isChecked ? selected.filter((v) => v !== String(o.value)) : [...selected, String(o.value)];
                              setField(f.name, next.join(","));
                            }}
                          />
                          {o.label}
                        </label>
                      );
                    })}
                  </div>
                ) : f.type === "textarea" ? (
                  <textarea
                    value={fieldValues[f.name] ?? ""} onChange={(e) => setField(f.name, e.target.value)}
                    placeholder={f.placeholder} rows={4}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-400 resize-none"
                  />
                ) : (
                  <input
                    type="text" value={fieldValues[f.name] ?? ""} onChange={(e) => setField(f.name, e.target.value)}
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
        </div>
      ) : (
        /* Textarea-based input */
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <span className="text-sm font-medium text-gray-600">{getInputLabel()}</span>
            <button onClick={handleClear} className="text-gray-400 hover:text-gray-600 transition-colors" title="Clear">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
          <textarea
            className="w-full p-4 text-sm font-mono resize-none focus:outline-none text-gray-800 min-h-[180px]"
            placeholder={getPlaceholder()}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
          />
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
          <><Loader2 className="w-4 h-4 animate-spin" /> {success ? "Done!" : "Processing..."}</>
        ) : (
          `Run — ${tool.name}`
        )}
      </button>

      {/* Progress animation (circular ring + linear bar) */}
      {loading && <ProcessingPanel progress={progress} phaseLabel="Processing..." success={success} />}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
          {error}
          {error.includes("upgrade") && (
            <a href="/pricing" className="block mt-2 text-violet-600 font-semibold hover:underline">
              Upgrade to Pro →
            </a>
          )}
        </div>
      )}

      {/* Result */}
      {result !== null && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <span className="text-sm font-medium text-gray-600">Result</span>
            <div className="flex items-center gap-2">
              <button
                onClick={copyResult}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Copy className="w-3 h-3" />
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={downloadResult}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Download className="w-3 h-3" />
                Download
              </button>
            </div>
          </div>
          <pre className="p-4 text-sm font-mono text-gray-800 overflow-x-auto whitespace-pre-wrap max-h-[400px] overflow-y-auto">
            {result}
          </pre>
        </div>
      )}

      {/* File result (e.g. qr-generator, base64-to-image, invoice-generator) */}
      {fileUrl && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
          {fileIsImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- blob: URL, not a static asset Next/Image can optimize
            <img src={fileUrl} alt="Tool result" className="max-w-full max-h-80 mx-auto mb-4 rounded-lg border border-gray-100" />
          ) : (
            <p className="text-sm text-gray-600 mb-4">Done — your file is ready.</p>
          )}
          <a
            href={fileUrl}
            download={fileFilename}
            className="inline-flex items-center gap-2 bg-violet-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-violet-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download {fileFilename}
          </a>
        </div>
      )}
    </div>
  );
}
