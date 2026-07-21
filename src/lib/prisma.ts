// ─── Prisma client singleton ──────────────────────────────────────────────────
// Standard Next.js pattern: reuse one client across hot-reloads in dev so each
// edit doesn't open a fresh pool of Postgres connections.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClient };

const prisma = globalForPrisma.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.__prisma = prisma;

export default prisma;
