// ─── Prisma shim — proxies to node:sqlite db ─────────────────────────────────
// This lets existing code that does `import prisma from "./prisma"` keep working.
// In production, replace this file with real Prisma + PostgreSQL.

import { userDb, toolUsageDb, subscriptionDb } from "./db";

// Prisma-compatible shim with the subset of methods used in this project
const prisma = {
  user: {
    findUnique: (args: { where: { id?: string; email?: string }; select?: Record<string, boolean> }) => {
      return userDb.findUnique(args.where) ?? null;
    },
    create: (args: { data: { name?: string; email: string; plan?: string; credits?: number } }) => {
      return userDb.create(args.data);
    },
    update: (args: { where: { id: string }; data: Record<string, unknown> }) => {
      // Handle Prisma's { decrement } shorthand for credits
      const data: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(args.data)) {
        if (v && typeof v === "object" && "decrement" in (v as Record<string, unknown>)) {
          const current = userDb.findUnique({ id: args.where.id }) as Record<string, unknown> | undefined;
          const cur = (current?.[k] as number) ?? 0;
          data[k] = Math.max(0, cur - ((v as Record<string, unknown>).decrement as number));
        } else {
          data[k] = v;
        }
      }
      return userDb.update(args.where, data as { plan?: string; credits?: number });
    },
  },
  toolUsage: {
    create: (args: { data: Record<string, unknown> }) => {
      return toolUsageDb.create(args.data as Parameters<typeof toolUsageDb.create>[0]);
    },
  },
  subscription: {
    findFirst: (args: { where: Record<string, unknown> }) => {
      return subscriptionDb.findFirst(args.where as { stripeSubscriptionId?: string }) ?? null;
    },
    findUnique: (args: { where: { userId: string } }) => {
      return subscriptionDb.findByUserId(args.where.userId) ?? null;
    },
    upsert: (args: { where: Record<string, unknown>; create: Record<string, unknown>; update: Record<string, unknown> }) => {
      return subscriptionDb.upsert(args.where as { userId: string }, { ...args.create, ...args.update });
    },
    update: (args: { where: { userId: string }; data: Record<string, unknown> }) => {
      return subscriptionDb.update(args.where, args.data);
    },
  },
};

export default prisma;
