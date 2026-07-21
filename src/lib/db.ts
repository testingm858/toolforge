// ─── Toolforge Local Database (Node 22 built-in SQLite) ──────────────────────
// Zero dependencies. Production: swap this file for Prisma + PostgreSQL.
// Node 22 ships node:sqlite natively — no npm install needed.

// @ts-expect-error — node:sqlite is experimental in Node 22, no TS types yet
import { DatabaseSync } from "node:sqlite";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "prisma", "dev.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

// Singleton (reuse across hot-reloads in dev)
const globalDb = globalThis as unknown as { __db?: InstanceType<typeof DatabaseSync> };

export function getDb() {
  if (!globalDb.__db) {
    globalDb.__db = new DatabaseSync(DB_PATH);
    bootstrap(globalDb.__db);
  }
  return globalDb.__db!;
}

// ─── Schema bootstrap (runs once on first connect) ────────────────────────────
function bootstrap(db: InstanceType<typeof DatabaseSync>) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE NOT NULL,
      emailVerified TEXT,
      image TEXT,
      plan TEXT DEFAULT 'FREE',
      credits INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      type TEXT NOT NULL,
      provider TEXT NOT NULL,
      providerAccountId TEXT NOT NULL,
      refresh_token TEXT,
      access_token TEXT,
      expires_at INTEGER,
      token_type TEXT,
      scope TEXT,
      id_token TEXT,
      session_state TEXT,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(provider, providerAccountId)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      sessionToken TEXT UNIQUE NOT NULL,
      userId TEXT NOT NULL,
      expires TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS verification_tokens (
      identifier TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires TEXT NOT NULL,
      UNIQUE(identifier, token)
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      userId TEXT UNIQUE NOT NULL,
      stripeCustomerId TEXT UNIQUE,
      stripeSubscriptionId TEXT UNIQUE,
      stripePriceId TEXT,
      plan TEXT DEFAULT 'FREE',
      status TEXT DEFAULT 'ACTIVE',
      creditsMonthly INTEGER DEFAULT 0,
      currentPeriodEnd TEXT,
      cancelAtPeriodEnd INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tool_usages (
      id TEXT PRIMARY KEY,
      userId TEXT,
      toolId TEXT NOT NULL,
      category TEXT NOT NULL,
      plan TEXT DEFAULT 'FREE',
      latencyMs INTEGER,
      success INTEGER DEFAULT 1,
      creditsUsed INTEGER DEFAULT 0,
      errorMessage TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      userId TEXT,
      toolId TEXT NOT NULL,
      status TEXT DEFAULT 'QUEUED',
      priority INTEGER DEFAULT 3,
      resultUrl TEXT,
      errorMsg TEXT,
      progress INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      completedAt TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_tool_usages_tool ON tool_usages(toolId, createdAt);
    CREATE INDEX IF NOT EXISTS idx_jobs_user ON jobs(userId, status);
  `);
}

// ─── ID generator ─────────────────────────────────────────────────────────────
function cuid(): string {
  return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// ─── User helpers ──────────────────────────────────────────────────────────────
export const userDb = {
  findUnique: (where: { id?: string; email?: string }) => {
    const db = getDb();
    if (where.id) return db.prepare("SELECT * FROM users WHERE id = ?").get(where.id) as Record<string, unknown> | undefined;
    if (where.email) return db.prepare("SELECT * FROM users WHERE email = ?").get(where.email) as Record<string, unknown> | undefined;
    return undefined;
  },
  create: (data: { name?: string; email: string; plan?: string; credits?: number }) => {
    const db = getDb();
    const id = cuid();
    db.prepare("INSERT INTO users (id, name, email, plan, credits) VALUES (?, ?, ?, ?, ?)").run(
      id, data.name ?? null, data.email, data.plan ?? "FREE", data.credits ?? 0
    );
    return { id, ...data };
  },
  update: (where: { id: string }, data: { plan?: string; credits?: number }) => {
    const db = getDb();
    const sets: string[] = [];
    const vals: unknown[] = [];
    if (data.plan !== undefined) { sets.push("plan = ?"); vals.push(data.plan); }
    if (data.credits !== undefined) { sets.push("credits = ?"); vals.push(data.credits); }
    if (sets.length > 0) {
      vals.push(where.id);
      db.prepare(`UPDATE users SET ${sets.join(", ")}, updatedAt = datetime('now') WHERE id = ?`).run(...vals);
    }
    return userDb.findUnique({ id: where.id });
  },
};

// ─── Session helpers ──────────────────────────────────────────────────────────
export const sessionDb = {
  findUnique: (where: { sessionToken: string }) => {
    return getDb().prepare("SELECT * FROM sessions WHERE sessionToken = ?").get(where.sessionToken) as Record<string, unknown> | undefined;
  },
  create: (data: { sessionToken: string; userId: string; expires: Date }) => {
    const db = getDb();
    const id = cuid();
    db.prepare("INSERT INTO sessions (id, sessionToken, userId, expires) VALUES (?, ?, ?, ?)").run(
      id, data.sessionToken, data.userId, data.expires.toISOString()
    );
    return { id, ...data };
  },
  delete: (where: { sessionToken: string }) => {
    getDb().prepare("DELETE FROM sessions WHERE sessionToken = ?").run(where.sessionToken);
  },
  update: (where: { sessionToken: string }, data: { expires: Date }) => {
    getDb().prepare("UPDATE sessions SET expires = ? WHERE sessionToken = ?").run(data.expires.toISOString(), where.sessionToken);
  },
};

// ─── Tool usage logging ───────────────────────────────────────────────────────
export const toolUsageDb = {
  create: (data: {
    userId?: string; toolId: string; category: string;
    plan?: string; latencyMs?: number; success?: boolean;
    creditsUsed?: number; errorMessage?: string;
  }) => {
    const db = getDb();
    const id = cuid();
    db.prepare(`
      INSERT INTO tool_usages (id, userId, toolId, category, plan, latencyMs, success, creditsUsed, errorMessage)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, data.userId ?? null, data.toolId, data.category,
      data.plan ?? "FREE", data.latencyMs ?? null,
      data.success !== false ? 1 : 0,
      data.creditsUsed ?? 0, data.errorMessage ?? null
    );
    return { id, ...data };
  },
};

// ─── Subscription helpers ─────────────────────────────────────────────────────
export const subscriptionDb = {
  findFirst: (where: { stripeSubscriptionId?: string }) => {
    if (where.stripeSubscriptionId) {
      return getDb().prepare("SELECT * FROM subscriptions WHERE stripeSubscriptionId = ?").get(where.stripeSubscriptionId) as Record<string, unknown> | undefined;
    }
    return undefined;
  },
  findByUserId: (userId: string) => {
    return getDb().prepare("SELECT * FROM subscriptions WHERE userId = ?").get(userId) as Record<string, unknown> | undefined;
  },
  upsert: (where: { userId: string }, data: Record<string, unknown>) => {
    const db = getDb();
    const existing = db.prepare("SELECT id FROM subscriptions WHERE userId = ?").get(where.userId);
    const id = cuid();
    if (existing) {
      const sets = Object.keys(data).map(k => `${k} = ?`).join(", ");
      db.prepare(`UPDATE subscriptions SET ${sets}, updatedAt = datetime('now') WHERE userId = ?`).run(...Object.values(data), where.userId);
    } else {
      db.prepare(`INSERT INTO subscriptions (id, userId, ${Object.keys(data).join(", ")}) VALUES (?, ?, ${Object.keys(data).map(() => "?").join(", ")})`).run(id, where.userId, ...Object.values(data));
    }
    return db.prepare("SELECT * FROM subscriptions WHERE userId = ?").get(where.userId);
  },
  update: (where: { userId: string }, data: Record<string, unknown>) => {
    const db = getDb();
    const sets = Object.keys(data).map(k => `${k} = ?`).join(", ");
    db.prepare(`UPDATE subscriptions SET ${sets} WHERE userId = ?`).run(...Object.values(data), where.userId);
  },
};

// ─── Default export (Prisma-compatible surface for app code) ──────────────────
const db = {
  user: userDb,
  session: sessionDb,
  toolUsage: toolUsageDb,
  subscription: subscriptionDb,
};

export default db;
