// Redis client — Upstash serverless Redis
// Falls back to in-memory mock when UPSTASH_REDIS_REST_URL is not set (local dev)

const hasRedis = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN &&
  process.env.UPSTASH_REDIS_REST_URL !== ""
);

// ─── In-memory fallback for local dev ────────────────────────────────────────
const memStore = new Map<string, { value: unknown; expiresAt?: number }>();

const memRedis = {
  get: async <T>(key: string): Promise<T | null> => {
    const entry = memStore.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) { memStore.delete(key); return null; }
    return entry.value as T;
  },
  set: async (key: string, value: unknown, opts?: { ex?: number }) => {
    memStore.set(key, { value, expiresAt: opts?.ex ? Date.now() + opts.ex * 1000 : undefined });
  },
  incr: async (key: string): Promise<number> => {
    const entry = memStore.get(key);
    const current = (entry?.value as number) ?? 0;
    const next = current + 1;
    memStore.set(key, { ...(entry ?? {}), value: next });
    return next;
  },
  expire: async (_key: string, _ttl: number) => {},
  del: async (key: string) => { memStore.delete(key); },
  lpush: async (key: string, value: string): Promise<number> => {
    const entry = memStore.get(key);
    const list = ((entry?.value as string[]) ?? []).slice();
    list.unshift(value);
    memStore.set(key, { ...(entry ?? {}), value: list });
    return list.length;
  },
  ltrim: async (key: string, start: number, stop: number) => {
    const entry = memStore.get(key);
    const list = (entry?.value as string[]) ?? [];
    memStore.set(key, { ...(entry ?? {}), value: list.slice(start, stop + 1) });
  },
  lrange: async (key: string, start: number, stop: number): Promise<string[]> => {
    const entry = memStore.get(key);
    const list = (entry?.value as string[]) ?? [];
    return stop === -1 ? list.slice(start) : list.slice(start, stop + 1);
  },
  exists: async (key: string): Promise<number> => {
    const entry = memStore.get(key);
    if (!entry) return 0;
    if (entry.expiresAt && Date.now() > entry.expiresAt) { memStore.delete(key); return 0; }
    return 1;
  },
};

// ─── Real Redis client (lazy-loaded so build doesn't fail without creds) ─────
let _redis: typeof memRedis | null = null;

async function getRedis() {
  if (!hasRedis) return memRedis;
  if (_redis) return _redis;
  const { Redis } = await import("@upstash/redis");
  _redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  }) as unknown as typeof memRedis;
  return _redis;
}

// ─── Usage counter helpers ────────────────────────────────────────────────────

export async function getUsageCount(identifier: string, toolId: string): Promise<number> {
  const db = await getRedis();
  const today = new Date().toISOString().split("T")[0];
  const key = `usage:${identifier}:${toolId}:${today}`;
  const count = await db.get<number>(key);
  return count ?? 0;
}

export async function incrementUsage(identifier: string, toolId: string): Promise<number> {
  const db = await getRedis();
  const today = new Date().toISOString().split("T")[0];
  const key = `usage:${identifier}:${toolId}:${today}`;
  const count = await db.incr(key);
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(24, 0, 0, 0);
  const ttl = Math.floor((midnight.getTime() - now.getTime()) / 1000);
  await db.expire(key, ttl);
  return count;
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

export async function getCached<T>(key: string): Promise<T | null> {
  const db = await getRedis();
  return db.get<T>(key);
}

export async function setCached<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const db = await getRedis();
  await db.set(key, value, { ex: ttlSeconds });
}

// ─── Job status ───────────────────────────────────────────────────────────────

export async function setJobStatus(jobId: string, data: Record<string, unknown>, ttlSeconds = 86400): Promise<void> {
  const db = await getRedis();
  await db.set(`job:${jobId}`, JSON.stringify(data), { ex: ttlSeconds });
}

export async function getJobStatus(jobId: string) {
  const db = await getRedis();
  const raw = await db.get<string>(`job:${jobId}`);
  return raw ? JSON.parse(raw as string) : null;
}

// ─── Webhook tester ─────────────────────────────────────────────────────────
// Sessions live for 30 minutes; we keep only the most recent 20 requests per
// session so a misbehaving sender can't grow the key unbounded.

export interface CapturedWebhookRequest {
  method: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body: string;
  receivedAt: string;
}

const WEBHOOK_TTL_SECONDS = 30 * 60;
const WEBHOOK_MAX_CAPTURED = 20;

export async function createWebhookSession(token: string): Promise<void> {
  const db = await getRedis();
  const key = `webhook:${token}`;
  await db.del(key);
  await db.lpush(key, "");
  await db.ltrim(key, 1, 0); // drop the placeholder, leaves an empty-but-existing list
  await db.expire(key, WEBHOOK_TTL_SECONDS);
}

export async function webhookSessionExists(token: string): Promise<boolean> {
  const db = await getRedis();
  return (await db.exists(`webhook:${token}`)) === 1;
}

export async function captureWebhookRequest(token: string, entry: CapturedWebhookRequest): Promise<boolean> {
  const db = await getRedis();
  const key = `webhook:${token}`;
  if (!(await webhookSessionExists(token))) return false;
  await db.lpush(key, JSON.stringify(entry));
  await db.ltrim(key, 0, WEBHOOK_MAX_CAPTURED - 1);
  await db.expire(key, WEBHOOK_TTL_SECONDS);
  return true;
}

export async function getWebhookRequests(token: string): Promise<CapturedWebhookRequest[] | null> {
  const db = await getRedis();
  const key = `webhook:${token}`;
  if (!(await webhookSessionExists(token))) return null;
  const raw = await db.lrange(key, 0, -1);
  return raw.filter(Boolean).map((r) => JSON.parse(r) as CapturedWebhookRequest);
}
