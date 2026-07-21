# ToolForge — Setup Guide

## Quick Start (3 steps)

### 1. Install dependencies
```bash
cd toolforge
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
# Local dev works out of the box with the defaults in .env.local:
# - DATABASE_URL is a local SQLite file (no external DB needed)
# - Redis is optional locally — an in-memory fallback is used when unset
# - NEXTAUTH_SECRET is already filled in for local dev
# - GOOGLE_CLIENT_ID/SECRET are placeholders — sign-in will error until you add real ones
```

### 3. Run
```bash
npm run dev               # Start dev server → http://localhost:3000
```
No database setup step is needed — `src/lib/db.ts` creates and migrates the
local SQLite file (`prisma/dev.db`) automatically on first run, using Node's
built-in `node:sqlite` (requires Node 22.5+). `prisma/schema.prisma` documents
the same shape for a future PostgreSQL migration but isn't used at runtime —
see the comment at the top of that file before running any `prisma` command.

---

## What's Built

### Files Created
```
src/
  app/
    layout.tsx              ← Root layout (Navbar + Footer + SessionProvider)
    page.tsx                ← Homepage with hero, tool grid, AI section
    globals.css             ← Base styles
    pricing/page.tsx        ← Pricing page (3 plans, annual toggle)
    tools/[toolId]/page.tsx ← Dynamic tool page (181 pages auto-generated)
    category/[category]/    ← Category listing pages
    api/
      tools/[toolId]/       ← Unified tool API (Orchestrator routes here)
      auth/[...nextauth]/   ← Auth endpoints
      billing/
        checkout/           ← Stripe checkout session
        webhook/            ← Stripe webhook handler

  lib/
    tools.ts                ← ALL 181 tools registry (categories, metadata)
    orchestrator.ts         ← Master Orchestrator Agent (plan gates, routing)
    redis.ts                ← Redis helpers (usage counters, cache, jobs)
    prisma.ts               ← Prisma client singleton
    auth.ts                 ← NextAuth config (Google + Email)
    stripe.ts               ← Billing Agent (Stripe + plan config)
    utils.ts                ← cn(), slugify(), etc.

  tools/                    ← Pure tool implementations (no deps)
    dev/json-formatter.ts
    dev/base64.ts
    dev/url-encoder.ts
    dev/hash-generator.ts   ← MD5 + SHA-1/256/384/512 (Web Crypto)
    dev/uuid-generator.ts
    dev/jwt-decoder.ts
    text/password-generator.ts
    text/case-converter.ts  ← + word counter + slug generator
    calc/bmi-calculator.ts
    calc/loan-calculator.ts ← + mortgage calculator
    design/color-tools.ts   ← HEX/RGB/HSL + palette + CSS generators

  components/
    Navbar.tsx              ← Sticky nav with category dropdowns
    Footer.tsx              ← Full footer with all links
    ToolCard.tsx            ← Reusable tool card (free/premium variants)
    ToolInterface.tsx       ← Generic tool UI (input → API → result)
    SessionProvider.tsx     ← NextAuth session wrapper

prisma/schema.prisma        ← DB: users, subscriptions, tool_usages, jobs, tools
```

### Agent Map
| Agent | Location |
|-------|----------|
| Master Orchestrator | `src/lib/orchestrator.ts` |
| Auth Agent | `src/lib/auth.ts` |
| Billing Agent | `src/lib/stripe.ts` + `api/billing/` |
| Free Tool Agent | `src/tools/dev/`, `src/tools/text/`, etc. |
| AI Tool Agent | `api/tools/[toolId]/route.ts` (dispatch) |
| Cache Agent | `src/lib/redis.ts` |
| Job Queue Agent | `Bull + Redis` (wire up in Phase 2) |
| Analytics Agent | `src/lib/orchestrator.ts` → `logUsage()` |
| SEO Engine Agent | `generateMetadata()` in every page |
| Monitor Agent | Wire Sentry + Uptime Kuma (Phase 2) |

---

## Next Steps (Phase 1 completion)

### Tools to add handlers for in `api/tools/[toolId]/route.ts`:
- PDF tools → install `pdf-lib`, add handlers
- Image tools → install `sharp`, add handlers
- QR code → install `qrcode`
- Diff checker → install `diff`

### Services to wire up:
- Supabase (PostgreSQL): https://supabase.com
- Upstash Redis: https://upstash.com
- Stripe: https://stripe.com (create Pro + Enterprise products)
- Google OAuth: https://console.cloud.google.com

### Deploy:
```bash
# Vercel (recommended)
npx vercel deploy

# Or Railway
railway up
```

---

## Revenue Targets (from roadmap)
- Month 3: 10,000 MAU, SEO foundation
- Month 4: $1,000 MRR (billing live)
- Month 6: $5,000 MRR (all 60 AI tools)
- Month 12: $10,000 MRR (API platform)
