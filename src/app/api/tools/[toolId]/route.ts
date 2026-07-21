// ─── Unified Tool API Route ───────────────────────────────────────────────────
// POST /api/tools/:toolId
// All tool requests flow through this single endpoint.
// The Orchestrator gates every request before passing to tool handlers.

import { NextRequest, NextResponse } from "next/server";
import net from "node:net";
import { orchestrate, logUsage } from "@/lib/orchestrator";
import { createWebhookSession } from "@/lib/redis";
import { getToolById } from "@/lib/tools";
import { formatJson, minifyJson } from "@/tools/dev/json-formatter";
import { encodeBase64, decodeBase64 } from "@/tools/dev/base64";
import { encodeUrl, decodeUrl } from "@/tools/dev/url-encoder";
import { generateUUIDs } from "@/tools/dev/uuid-generator";
import { generateAllHashes, md5 } from "@/tools/dev/hash-generator";
import { decodeJwt } from "@/tools/dev/jwt-decoder";
import { generatePasswords } from "@/tools/text/password-generator";
import { convertCase, generateSlug, countWords } from "@/tools/text/case-converter";
import { calculateBMI } from "@/tools/calc/bmi-calculator";
import { calculateLoan, calculateMortgage } from "@/tools/calc/loan-calculator";
import {
  hexToRgb, rgbToHex, rgbToHsl, generatePalette, generateComplementaryColors,
  generateCssGradient, generateBoxShadow,
} from "@/tools/design/color-tools";
import {
  formatXml, formatHtml, minifyHtml, formatCss, minifyCss, beautifyJs, minifyJs, formatSql,
} from "@/tools/dev/formatters";
import { csvToJson, jsonToCsv } from "@/tools/dev/csv-json";
import {
  generateLoremIpsum, diffLines, explainCron, generateGitignore, generateHtaccess,
} from "@/tools/dev/misc-generators";
import { encodeJwt } from "@/tools/dev/jwt-encoder";
import { markdownToHtml } from "@/tools/dev/markdown";
import { testRegex } from "@/tools/dev/regex-tester";
import {
  removeDuplicateLines, removeExtraSpaces, sortLines, reverseText, generateUsernames,
} from "@/tools/text/text-utils";
import { buildContract } from "@/tools/text/contract-builder";
import {
  calculateAge, calculateGst, calculateProfitMargin, calculatePercentage,
  calculatePregnancy, calculateBmr, calculateCalories, calculateFuelCost,
  calculateRoi, calculateMrr, calculateMeetingCost, convertTimezone,
} from "@/tools/calc/misc-calculators";
import {
  generateButtonCss, generateKeyframeAnimation, generateGridCss,
  generateFlexboxCss, generateSvgBlob,
} from "@/tools/design/more-css-generators";
import {
  generateCanonicalUrl, generateTwitterCard, generateHreflang,
  analyzeKeywordDensity, htmlEncode, generateSitemap,
} from "@/tools/seo/seo-tools";
import { checkHttpHeaders, checkRedirectChain, isPrivateIPv4, isPrivateIPv6 } from "@/tools/seo/network-tools";
import { escapeAttr } from "@/tools/seo/seo-tools";
import { isFileTool } from "@/lib/file-tools";
import { dispatchFile } from "./file-dispatch";
import { binaryOutput, isBinaryOutput } from "@/lib/binary-output";
import { generateQrCode } from "@/tools/image/qr-tools";
import { base64ToImage } from "@/tools/image/base64-image";
import { generateBarcode } from "@/tools/image/barcode-tools";
import { formatYaml } from "@/tools/dev/yaml-formatter";
import { generateInvoicePdf } from "@/tools/pdf/invoice-generator";
import { generateResumePdf } from "@/tools/pdf/resume-builder";
import { generateText, generateImageUrl } from "@/lib/ai-provider";
import { AI_PROMPT_TOOLS } from "@/tools/ai/prompts";
import { contentDispositionValue } from "@/lib/file-download-name";
import { convertCurrency } from "@/tools/calc/currency-converter";
import { lookupIp } from "@/tools/dev/ip-lookup";

const AI_IMAGE_TOOLS = new Set(["ai-image-generator", "ai-logo-generator"]);

// Free-tier file size cap (Pro/Enterprise limits are documented in stripe.ts
// PLANS but not yet enforced per-request here — see orchestrator.ts).
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ toolId: string }> }
) {
  const { toolId } = await params;
  const start = Date.now();

  // ── 1. Orchestrator gate ──────────────────────────────────────────────────
  const { allowed, ctx, error } = await orchestrate(req, toolId);
  if (!allowed) return error!;

  const tool = getToolById(toolId)!;
  const contentType = req.headers.get("content-type") ?? "";

  // ── File-upload tools take a different path: multipart body in, binary
  //    (or JSON, for read-only tools like metadata viewing) out. ────────────
  if (isFileTool(toolId)) {
    if (!contentType.startsWith("multipart/form-data")) {
      return NextResponse.json({ error: "This tool expects a multipart/form-data upload" }, { status: 400 });
    }

    let success = true;
    let errorMsg: string | undefined;
    let fileResult: Awaited<ReturnType<typeof dispatchFile>> | undefined;

    try {
      const formData = await req.formData();
      for (const value of formData.getAll("file").concat(formData.getAll("files"))) {
        if (value instanceof File && value.size > MAX_UPLOAD_BYTES) {
          throw new Error(`File "${value.name}" exceeds the 10MB free-tier limit`);
        }
      }
      fileResult = await dispatchFile(toolId, formData);
    } catch (err) {
      success = false;
      errorMsg = (err as Error).message;
    }

    const latencyMs = Date.now() - start;
    const fileCreditsUsed = success && tool.isPremium ? (tool.creditsPerUse ?? 0) : 0;
    logUsage(ctx, toolId, tool.category, latencyMs, success, fileCreditsUsed, errorMsg).catch(console.error);

    if (!success) return NextResponse.json({ error: errorMsg }, { status: 500 });
    if (fileResult!.json !== undefined) {
      return NextResponse.json({ result: fileResult!.json, latencyMs });
    }
    return new NextResponse(fileResult!.bytes as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": fileResult!.contentType ?? "application/octet-stream",
        "Content-Disposition": contentDispositionValue(fileResult!.filename ?? "download"),
        ...(fileResult!.extraHeaders ?? {}),
      },
    });
  }

  // ── 2. Parse request body ─────────────────────────────────────────────────
  // req.json() buffers the whole body into memory with no size cap of its
  // own — confirmed a 20MB JSON payload was accepted and processed in
  // ~400ms with nothing rejecting it. Every JSON-dispatched tool (the vast
  // majority of tools) shares this one route, and Pro/Enterprise plans have
  // no daily-use limit to fall back on, so an oversized body here is an
  // effectively unbounded memory vector. Real tool inputs are short text —
  // this cap is already generous for even a long pasted document.
  const MAX_JSON_BODY_BYTES = 5 * 1024 * 1024;
  const declaredLength = Number(req.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_JSON_BODY_BYTES) {
    return NextResponse.json({ error: "Request body too large" }, { status: 413 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // ── 3. Dispatch to tool handler ───────────────────────────────────────────
  // ip-lookup with no explicit IP means "look up my own IP" — the same
  // x-forwarded-for extraction the orchestrator already uses for rate
  // limiting, reused here instead of threading the whole request into
  // dispatch() just for this one case. Skip injecting anything that isn't a
  // plausible public IP (missing header, or a private/internal address from
  // a misconfigured proxy) — falling through to no ip param lets lookupIp()
  // ask freeipapi.com to detect the request's own public IP instead of
  // surfacing a "private IP" error for something the user never typed.
  if (toolId === "ip-lookup" && !body.ip) {
    const forwardedIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (forwardedIp) {
      const version = net.isIP(forwardedIp);
      const isPrivate = version === 4 ? isPrivateIPv4(forwardedIp) : version === 6 ? isPrivateIPv6(forwardedIp) : true;
      if (!isPrivate) body = { ...body, ip: forwardedIp };
    }
  }

  let result: unknown;
  let success = true;
  let errorMsg: string | undefined;

  try {
    result = await dispatch(toolId, body);
  } catch (err) {
    success = false;
    errorMsg = (err as Error).message;
    result = { error: errorMsg };
  }

  // ── 4. Log usage (non-blocking) ───────────────────────────────────────────
  const latencyMs = Date.now() - start;
  const creditsUsed = success && tool.isPremium ? (tool.creditsPerUse ?? 0) : 0;
  logUsage(ctx, toolId, tool.category, latencyMs, success, creditsUsed, errorMsg).catch(console.error);

  // ── 5. Return result ──────────────────────────────────────────────────────
  if (success && isBinaryOutput(result)) {
    return new NextResponse(result.bytes as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": result.contentType,
        "Content-Disposition": `attachment; filename="${result.filename}"`,
      },
    });
  }
  return NextResponse.json({ result, latencyMs }, { status: success ? 200 : 500 });
}

// ─── Tool Dispatcher ──────────────────────────────────────────────────────────
//
// ToolInterface (the generic tool UI) always POSTs a single textarea value as
// { input: "<text>" }. Most handlers below read body.input directly. A few
// tools take multiple/named fields instead — for those, the textarea holds a
// JSON object (see ToolInterface's per-tool placeholders) or a single scalar
// under a different key. normalizeBody() bridges that gap so the generic UI
// works for every tool without a bespoke form per tool.

const STRUCTURED_JSON_TOOLS = new Set([
  "bmi-calculator",
  "loan-calculator",
  "mortgage-calculator",
  "meta-tag-generator",
  "og-generator",
  "schema-generator",
  "robots-txt",
  "rgb-to-hex",
  "regex-tester",
  "jwt-encoder",
  "lorem-ipsum",
  "diff-checker",
  "gitignore-generator",
  "htaccess-generator",
  "contract-builder",
  "age-calculator",
  "gst-calculator",
  "profit-calculator",
  "percentage-calculator",
  "timezone-calculator",
  "pregnancy-calculator",
  "calorie-calculator",
  "bmr-calculator",
  "fuel-calculator",
  "roi-calculator",
  "mrr-calculator",
  "meeting-cost",
  "gradient-generator",
  "box-shadow",
  "button-generator",
  "animation-generator",
  "grid-generator",
  "flexbox-generator",
  "svg-blob-generator",
  "sitemap-generator",
  "twitter-card",
  "hreflang-generator",
  "keyword-density",
  "qr-generator",
  "barcode-generator",
  "invoice-generator",
  "resume-builder",
  "currency-converter",
  "ip-lookup",
  "password-generator",
  "case-converter",
]);

// AI prompt tools accept EITHER a JSON object (full control over every
// field) OR plain text, which becomes the tool's primary field — so
// "How to brew pour-over coffee" works directly for ai-blog-writer without
// wrapping it as {"topic": "..."}.
const AI_TOOL_PRIMARY_FIELD: Record<string, string> = {
  "ai-blog-writer": "topic",
  "ai-content-repurposer": "content",
  "ai-cold-email": "product",
  "ai-product-description": "productName",
  "ai-job-description": "jobTitle",
  "ai-ad-copy": "product",
  "ai-youtube-script": "topic",
  "ai-newsletter": "topic",
  "ai-linkedin-post": "topic",
  "ai-twitter-thread": "topic",
  "ai-paraphraser": "text",
  "ai-grammar-checker": "text",
  "ai-summarizer": "text",
  "ai-cover-letter": "jobTitle",
  "ai-resume-reviewer": "resumeText",
  "ai-proposal-writer": "projectName",
  "ai-press-release": "announcement",
  "ai-faq-generator": "topic",
  "ai-meta-description": "pageTitle",
  "ai-title-generator": "topic",
  "ai-email-subject": "subjectLine",
  "ai-ab-copy": "original",
  "ai-caption-generator": "description",
  "ai-task-prioritizer": "tasks",
  "ai-email-sequence": "goal",
  "ai-outreach-generator": "prospect",
  "ai-language-detector": "text",
  "ai-sentiment-analyzer": "text",
  "ai-csv-analyzer": "csvData",
  "ai-report-generator": "data",
  "ai-image-generator": "prompt",
  "ai-logo-generator": "prompt",
  "ai-chatbot-builder": "purpose",
  "ai-support-bot": "product",
  "ai-faq-chatbot": "content",
  "ai-slack-bot": "purpose",
  "ai-social-scheduler": "topic",
};

const SINGLE_FIELD_TOOLS: Record<string, string> = {
  "hex-to-rgb": "hex",
  "color-palette": "hex",
  // jwt-decoder has no dedicated form fields, so ToolInterface's generic
  // textarea posts { input: "<pasted JWT>" } — but the dispatch below reads
  // body.token, which was always undefined without this mapping. Confirmed
  // this made jwt-decoder crash on every single real request (even a
  // genuinely valid JWT) with "Cannot read properties of undefined
  // (reading 'trim')", via both curl and the live browser UI.
  "jwt-decoder": "token",
  // Same bug, same fix: word-counter and slug-generator read body.text,
  // which was never populated by the generic textarea's { input } post.
  // Confirmed both crashed on every real request ("Cannot read properties
  // of undefined") — these two tools have never worked either.
  "word-counter": "text",
  "slug-generator": "text",
};

function normalizeBody(toolId: string, body: Record<string, unknown>): Record<string, unknown> {
  if (typeof body.input !== "string" || body.input.trim() === "") return body;

  if (STRUCTURED_JSON_TOOLS.has(toolId)) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(body.input);
    } catch {
      throw new Error("Invalid JSON input. Expected an object like the example shown above the input box.");
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Invalid JSON input. Expected a JSON object.");
    }
    return { ...body, ...(parsed as Record<string, unknown>) };
  }

  const field = SINGLE_FIELD_TOOLS[toolId];
  if (field && body[field] === undefined) {
    return { ...body, [field]: body.input };
  }

  const primaryField = AI_TOOL_PRIMARY_FIELD[toolId];
  if (primaryField) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(body.input);
    } catch {
      parsed = undefined;
    }
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return { ...body, ...(parsed as Record<string, unknown>) };
    }
    return { ...body, [primaryField]: body.input };
  }

  return body;
}

async function dispatch(toolId: string, rawBody: Record<string, unknown>): Promise<unknown> {
  const body = normalizeBody(toolId, rawBody);

  // ── AI Tools (OpenAI-backed) ──────────────────────────────────────────────
  const promptConfig = AI_PROMPT_TOOLS[toolId];
  if (promptConfig) {
    const userPrompt = promptConfig.buildUserPrompt(body);
    if (!userPrompt.trim()) throw new Error("Please provide some input for this tool.");
    const text = await generateText(promptConfig.systemPrompt, userPrompt, { maxTokens: promptConfig.maxTokens });
    return { result: text };
  }
  if (AI_IMAGE_TOOLS.has(toolId)) {
    const prompt = (body.prompt as string) ?? "";
    if (!prompt.trim()) throw new Error("Please describe the image you want to generate.");
    const fullPrompt = toolId === "ai-logo-generator" ? `A clean, professional logo design: ${prompt}` : prompt;
    const imageUrl = await generateImageUrl(fullPrompt, { size: body.size as never });
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error("Could not download the generated image");
    const bytes = new Uint8Array(await imgRes.arrayBuffer());
    return binaryOutput(bytes, "image/png", `${toolId}.png`);
  }

  switch (toolId) {
    // ── Developer Tools ──
    case "json-formatter":
      return formatJson(body.input as string, (body.indent as number) ?? 2);

    case "json-minifier":
      return minifyJson(body.input as string);

    case "base64-encoder":
      if (body.mode === "decode") return decodeBase64(body.input as string);
      return { result: encodeBase64(body.input as string), valid: true };

    case "url-encoder":
      if (body.mode === "decode") return decodeUrl(body.input as string);
      return { result: encodeUrl(body.input as string, body.full as boolean), valid: true };

    case "uuid-generator":
      return { uuids: generateUUIDs((body.count as number) ?? 1) };

    case "hash-generator": {
      const input = body.input as string;
      if (body.algorithm === "md5") return { result: md5(input), algorithm: "MD5" };
      return generateAllHashes(input);
    }

    case "jwt-decoder":
      return decodeJwt(body.token as string);

    case "ip-lookup":
      return lookupIp(body.ip as string | undefined);

    case "jwt-encoder":
      return encodeJwt(
        body.payload as Record<string, unknown>,
        body.secret as string,
        body.expiresInSeconds as number | undefined
      );

    case "xml-formatter":
      return formatXml(body.input as string);

    case "html-formatter":
      return formatHtml(body.input as string);

    case "html-minifier":
      return minifyHtml(body.input as string);

    case "css-formatter":
      return formatCss(body.input as string);

    case "css-minifier":
      return minifyCss(body.input as string);

    case "js-beautifier":
      return beautifyJs(body.input as string);

    case "js-minifier":
      return minifyJs(body.input as string);

    case "sql-formatter":
      return formatSql(body.input as string);

    case "csv-to-json":
      return csvToJson(body.input as string);

    case "json-to-csv":
      return jsonToCsv(body.input as string);

    case "markdown-preview":
    case "markdown-convert":
      return markdownToHtml(body.input as string);

    case "regex-tester":
      return testRegex(body.pattern as string, (body.flags as string) ?? "", body.testString as string);

    case "lorem-ipsum":
      return generateLoremIpsum(
        (body.count as number) ?? 3,
        (body.unit as "words" | "sentences" | "paragraphs") ?? "paragraphs"
      );

    case "diff-checker":
      return { diff: diffLines(body.textA as string, body.textB as string) };

    case "cron-generator":
      return explainCron(body.input as string);

    case "gitignore-generator":
      return generateGitignore(body.stacks as string[]);

    case "htaccess-generator":
      return generateHtaccess(body as Parameters<typeof generateHtaccess>[0]);

    case "webhook-tester": {
      const token = crypto.randomUUID();
      await createWebhookSession(token);
      return { token };
    }

    // ── Text Tools ──
    case "password-generator":
      return {
        passwords: generatePasswords(
          {
            length: (body.length as number) ?? 16,
            uppercase: (body.uppercase as boolean) ?? true,
            lowercase: (body.lowercase as boolean) ?? true,
            numbers: (body.numbers as boolean) ?? true,
            symbols: (body.symbols as boolean) ?? false,
            excludeAmbiguous: (body.excludeAmbiguous as boolean) ?? false,
          },
          (body.count as number) ?? 1
        ),
      };

    case "case-converter":
      return { result: convertCase(body.text as string, body.caseType as never) };

    case "slug-generator":
      return { result: generateSlug(body.text as string) };

    case "word-counter":
      return countWords(body.text as string);

    case "remove-duplicates":
      return removeDuplicateLines(body.input as string);

    case "remove-spaces":
      return removeExtraSpaces(body.input as string);

    case "sort-text":
      return sortLines(body.input as string, (body.direction as "asc" | "desc") ?? "asc");

    case "reverse-text":
      return reverseText(body.input as string, (body.mode as "characters" | "words" | "lines") ?? "characters");

    case "username-generator":
      return { usernames: generateUsernames((body.count as number) ?? 5) };

    case "contract-builder":
      return buildContract(body as unknown as Parameters<typeof buildContract>[0]);

    // ── Calculators ──
    case "bmi-calculator":
      return calculateBMI(
        body.weight as number,
        body.height as number,
        (body.unit as "metric" | "imperial") ?? "metric"
      );

    case "loan-calculator":
      return calculateLoan(
        body.principal as number,
        body.rate as number,
        body.months as number
      );

    case "mortgage-calculator":
      return calculateMortgage(
        body.homePrice as number,
        (body.downPaymentPct as number) ?? 20,
        body.rate as number,
        (body.years as number) ?? 30
      );

    case "age-calculator":
      return calculateAge(body.birthDate as string, body.asOf as string | undefined);

    case "gst-calculator":
      return calculateGst(body.amount as number, body.rate as number, (body.mode as "exclusive" | "inclusive") ?? "exclusive");

    case "profit-calculator":
      return calculateProfitMargin(body.revenue as number, body.cost as number);

    case "percentage-calculator":
      return calculatePercentage(body.op as "of" | "change" | "whatPercent", body.a as number, body.b as number);

    case "timezone-calculator":
      return convertTimezone(body.dateTimeIso as string, body.fromZone as string, body.toZone as string);

    case "pregnancy-calculator":
      return calculatePregnancy(body.lastPeriodDate as string);

    case "calorie-calculator":
      return calculateCalories(
        body.weightKg as number, body.heightCm as number, body.age as number,
        body.sex as "male" | "female", body.activityLevel as never
      );

    case "bmr-calculator":
      return calculateBmr(body.weightKg as number, body.heightCm as number, body.age as number, body.sex as "male" | "female");

    case "fuel-calculator":
      return calculateFuelCost(body.distanceKm as number, body.fuelEfficiencyKmPerL as number, body.pricePerLiter as number);

    case "roi-calculator":
      return calculateRoi(body.gain as number, body.cost as number);

    case "mrr-calculator":
      return calculateMrr(
        body.customers as { plan: number; count: number }[],
        (body.churnedMrr as number) ?? 0,
        (body.newMrr as number) ?? 0
      );

    case "meeting-cost":
      return calculateMeetingCost(body.attendees as number, body.avgHourlySalary as number, body.durationMinutes as number);

    case "currency-converter":
      return convertCurrency(body.amount as number, body.from as string, body.to as string);

    // ── Color / Design Tools ──
    case "hex-to-rgb": {
      const rgb = hexToRgb(body.hex as string);
      if (!rgb) throw new Error("Invalid HEX color");
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      return { rgb, hsl, hex: body.hex };
    }

    case "rgb-to-hex":
      return { hex: rgbToHex(body.r as number, body.g as number, body.b as number) };

    case "color-palette":
      return {
        palette: generatePalette(body.hex as string),
        complementary: generateComplementaryColors(body.hex as string),
      };

    case "gradient-generator":
      return generateCssGradient(
        body.color1 as string, body.color2 as string,
        (body.angle as number) ?? 135, (body.type as "linear" | "radial") ?? "linear"
      );

    case "box-shadow":
      return generateBoxShadow(
        (body.offsetX as number) ?? 0, (body.offsetY as number) ?? 4,
        (body.blur as number) ?? 12, (body.spread as number) ?? 0,
        (body.color as string) ?? "rgba(0,0,0,0.25)", (body.inset as boolean) ?? false
      );

    case "button-generator":
      return generateButtonCss(body as Parameters<typeof generateButtonCss>[0]).css;

    case "animation-generator":
      return generateKeyframeAnimation(body as Parameters<typeof generateKeyframeAnimation>[0]).css;

    case "grid-generator":
      return generateGridCss(body as Parameters<typeof generateGridCss>[0]).css;

    case "flexbox-generator":
      return generateFlexboxCss(body as Parameters<typeof generateFlexboxCss>[0]).css;

    case "svg-blob-generator":
      return generateSvgBlob(body as Parameters<typeof generateSvgBlob>[0]).svg;

    // ── SEO Tools (pure generation) ──
    case "meta-tag-generator":
      return generateMetaTags(body);

    case "og-generator":
      return generateOgTags(body);

    case "schema-generator":
      return generateSchema(body);

    case "robots-txt":
      return generateRobotsTxt(body);

    case "sitemap-generator":
      return generateSitemap(body.urls as Parameters<typeof generateSitemap>[0]).xml;

    case "canonical-url":
      return generateCanonicalUrl(body.input as string).html;

    case "twitter-card":
      return generateTwitterCard(body).html;

    case "hreflang-generator":
      return generateHreflang(body.pages as { lang: string; url: string }[], body.defaultUrl as string | undefined).html;

    case "keyword-density":
      return analyzeKeywordDensity(body.text as string, body.targetKeyword as string | undefined);

    case "html-encode":
      return htmlEncode(body.input as string);

    case "http-header-checker":
      return checkHttpHeaders(body.input as string);

    case "redirect-checker":
      return checkRedirectChain(body.input as string);

    // ── Image Tools (JSON/text in, binary out) ──
    case "qr-generator": {
      const bytes = await generateQrCode(body.text as string, body as Parameters<typeof generateQrCode>[1]);
      return binaryOutput(bytes, "image/png", "qrcode.png");
    }

    case "base64-to-image": {
      const { bytes, mimeType, extension } = base64ToImage(body.input as string);
      return binaryOutput(bytes, mimeType, `image.${extension}`);
    }

    case "barcode-generator": {
      const bytes = await generateBarcode(body.text as string, body as Parameters<typeof generateBarcode>[1]);
      return binaryOutput(bytes, "image/png", "barcode.png");
    }

    case "yaml-formatter":
      return formatYaml(body.input as string);

    case "invoice-generator": {
      const bytes = await generateInvoicePdf(body as unknown as Parameters<typeof generateInvoicePdf>[0]);
      return binaryOutput(bytes, "application/pdf", "invoice.pdf");
    }

    case "resume-builder": {
      const bytes = await generateResumePdf(body as unknown as Parameters<typeof generateResumePdf>[0]);
      return binaryOutput(bytes, "application/pdf", "resume.pdf");
    }

    // ── Unimplemented (returns placeholder) ──
    default:
      throw new Error(`Tool handler for '${toolId}' is not yet implemented on the server. This tool may run client-side.`);
  }
}

// ─── SEO generators ───────────────────────────────────────────────────────────

function generateMetaTags(body: Record<string, unknown>): { html: string; tags: Record<string, string> } {
  const { title, description, keywords, author, canonical, noindex } = body as Record<string, string>;
  const tags: Record<string, string> = {};
  const lines: string[] = [];

  // Same rationale as seo-tools.ts's escapeAttr: this HTML is meant to be
  // pasted into the user's own <head>, and an unescaped value is a real
  // attribute-breakout injection there — confirmed with a quote-breakout
  // description producing a working injected onmouseover attribute.
  if (title) { tags["title"] = title; lines.push(`<title>${escapeAttr(title)}</title>`); }
  if (description) { tags["description"] = description; lines.push(`<meta name="description" content="${escapeAttr(description)}">`); }
  if (keywords) { tags["keywords"] = keywords; lines.push(`<meta name="keywords" content="${escapeAttr(keywords)}">`); }
  if (author) { tags["author"] = author; lines.push(`<meta name="author" content="${escapeAttr(author)}">`); }
  if (canonical) { lines.push(`<link rel="canonical" href="${escapeAttr(canonical)}">`); }
  if (noindex) { lines.push(`<meta name="robots" content="noindex,nofollow">`); }
  lines.push(`<meta name="viewport" content="width=device-width, initial-scale=1">`);
  lines.push(`<meta charset="UTF-8">`);

  return { html: lines.join("\n"), tags };
}

function generateOgTags(body: Record<string, unknown>): { html: string } {
  const { title, description, image, url, type = "website", siteName } = body as Record<string, string>;
  const lines: string[] = [];
  if (title)       lines.push(`<meta property="og:title" content="${escapeAttr(title)}">`);
  if (description) lines.push(`<meta property="og:description" content="${escapeAttr(description)}">`);
  if (image)       lines.push(`<meta property="og:image" content="${escapeAttr(image)}">`);
  if (url)         lines.push(`<meta property="og:url" content="${escapeAttr(url)}">`);
  if (type)        lines.push(`<meta property="og:type" content="${escapeAttr(type)}">`);
  if (siteName)    lines.push(`<meta property="og:site_name" content="${escapeAttr(siteName)}">`);
  // Twitter card
  lines.push(`<meta name="twitter:card" content="summary_large_image">`);
  if (title)       lines.push(`<meta name="twitter:title" content="${escapeAttr(title)}">`);
  if (description) lines.push(`<meta name="twitter:description" content="${escapeAttr(description)}">`);
  if (image)       lines.push(`<meta name="twitter:image" content="${escapeAttr(image)}">`);
  return { html: lines.join("\n") };
}

function generateSchema(body: Record<string, unknown>): { json: string } {
  const type = (body.type as string) ?? "WebPage";
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": type,
    ...body.data as Record<string, unknown>,
  };
  return { json: JSON.stringify(schema, null, 2) };
}

function generateRobotsTxt(body: Record<string, unknown>): { text: string } {
  const { sitemapUrl, disallowPaths = [], allowAll = true } = body as {
    sitemapUrl?: string; disallowPaths?: string[]; allowAll?: boolean;
  };
  const lines = ["User-agent: *"];
  if (allowAll) { lines.push("Allow: /"); }
  (disallowPaths as string[]).forEach((p: string) => lines.push(`Disallow: ${p}`));
  if (sitemapUrl) lines.push(`\nSitemap: ${sitemapUrl}`);
  return { text: lines.join("\n") };
}
