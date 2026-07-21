# ToolForge

All the tools you need in one place — PDF, image, audio, developer, SEO, writing, calculator, and design utilities, free forever with no signup required. Built with Next.js (App Router), TypeScript, and Tailwind CSS.

## What's inside

- **115 free tools** across 8 categories, each with its own dedicated page, real server-side processing, and no account required:
  - **PDF** (18) — merge, split, compress, rotate, watermark, sign, protect/unlock, OCR, page numbers, extract/remove/reorder pages, convert to/from Word and JPG
  - **Image** (16) — compress, resize, crop, rotate, convert formats, SVG conversion, favicon generation, metadata tools, color picker, QR/barcode generation
  - **Audio** (2) — format conversion, audio watermarking
  - **Developer** (30) — JSON/XML/YAML/SQL/CSS/JS formatters and minifiers, regex tester, JWT encode/decode, hash generator, UUID generator, webhook tester, IP lookup, and more
  - **SEO** (13) — meta tags, Open Graph, Twitter Cards, sitemap/robots.txt, schema.org, hreflang, header/redirect checkers
  - **Writing** (12) — case converter, password generator, slug generator, invoice/resume/contract builders, Word conversion
  - **Calculator** (16) — BMI, loan, mortgage, currency conversion, timezone, calorie/BMR, ROI, MRR, and more
  - **Design** (8) — gradient, box-shadow, button, animation, grid/flexbox, and SVG blob CSS generators
- **59 premium AI tools** (blog writing, summarization, translation, image generation, etc.), gated behind a Pro plan and backed by OpenAI — cleanly reports "not configured" if no API key is set, rather than failing silently.
- **Real file processing**, not stubs: `pdf-lib` + `mupdf` + `pdfjs-dist` for PDFs, `sharp` for images, `ffmpeg` for audio, `tesseract.js` for OCR (including a custom RTL-aware overlay for Arabic).
- **Max-strength compression** — Compress PDF rasterizes and re-encodes pages at low quality when that yields a smaller file than structural compaction alone (the same technique behind tools like iLovePDF's "Extreme" mode); Compress Image defaults to an aggressive quality/effort profile per format.
- **Polished upload UX** — every file tool shows a circular/linear progress animation during upload and processing, a graphical before/after size comparison, and downloads named `<original-name>_<operation>.<ext>`.
- Auth via NextAuth (Google OAuth), billing via Stripe, and a local SQLite dev database (Node's built-in `node:sqlite`, zero extra setup).

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in OPENAI_API_KEY / GOOGLE_CLIENT_ID / STRIPE keys as needed — see SETUP.md
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No database setup step is required — `src/lib/db.ts` creates the local SQLite file (`prisma/dev.db`) automatically on first run (requires Node 22.5+).

See [SETUP.md](./SETUP.md) for environment variable details and project structure notes.

## Tech stack

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS · NextAuth · Stripe · Node's built-in `node:sqlite` · `pdf-lib` / `mupdf` / `pdfjs-dist` · `sharp` · `ffmpeg-static` · `tesseract.js` · OpenAI SDK

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server at `localhost:3000` |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
