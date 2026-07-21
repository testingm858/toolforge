// ─── Auth Agent — NextAuth v4 with custom SQLite adapter ─────────────────────
import type { NextAuthOptions } from "next-auth";
import type { Adapter, AdapterUser, AdapterAccount, AdapterSession, VerificationToken } from "next-auth/adapters";
import GoogleProvider from "next-auth/providers/google";
import { userDb, getDb } from "./db";

function cuid() {
  return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// Custom NextAuth adapter backed by node:sqlite
const SQLiteAdapter: Adapter = {
  createUser: async (data: Omit<AdapterUser, "id">) => {
    const db = getDb();
    const id = cuid();
    db.prepare(
      "INSERT OR IGNORE INTO users (id, name, email, emailVerified, image, plan, credits) VALUES (?, ?, ?, ?, ?, 'FREE', 0)"
    ).run(id, data.name ?? null, data.email, data.emailVerified?.toISOString() ?? null, data.image ?? null);
    const row = db.prepare("SELECT * FROM users WHERE email = ?").get(data.email) as Record<string, unknown>;
    return { ...row, emailVerified: row.emailVerified ? new Date(row.emailVerified as string) : null } as AdapterUser;
  },

  getUser: async (id) => {
    const db = getDb();
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    return { ...row, emailVerified: row.emailVerified ? new Date(row.emailVerified as string) : null } as AdapterUser;
  },

  getUserByEmail: async (email) => {
    const db = getDb();
    const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as Record<string, unknown> | undefined;
    if (!row) return null;
    return { ...row, emailVerified: row.emailVerified ? new Date(row.emailVerified as string) : null } as AdapterUser;
  },

  getUserByAccount: async ({ provider, providerAccountId }) => {
    const db = getDb();
    const acc = db.prepare(
      "SELECT userId FROM accounts WHERE provider = ? AND providerAccountId = ?"
    ).get(provider, providerAccountId) as { userId: string } | undefined;
    if (!acc) return null;
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(acc.userId) as Record<string, unknown> | undefined;
    if (!row) return null;
    return { ...row, emailVerified: row.emailVerified ? new Date(row.emailVerified as string) : null } as AdapterUser;
  },

  updateUser: async ({ id, ...data }) => {
    const db = getDb();
    const sets = Object.keys(data).map(k => `${k} = ?`).join(", ");
    if (sets) {
      db.prepare(`UPDATE users SET ${sets}, updatedAt = datetime('now') WHERE id = ?`).run(
        ...Object.values(data).map(v => v instanceof Date ? v.toISOString() : v), id
      );
    }
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as Record<string, unknown>;
    return { ...row, emailVerified: row.emailVerified ? new Date(row.emailVerified as string) : null } as AdapterUser;
  },

  deleteUser: async (userId) => {
    getDb().prepare("DELETE FROM users WHERE id = ?").run(userId);
  },

  linkAccount: async (data: AdapterAccount) => {
    const db = getDb();
    const id = cuid();
    db.prepare(`
      INSERT OR IGNORE INTO accounts (id, userId, type, provider, providerAccountId, refresh_token, access_token, expires_at, token_type, scope, id_token, session_state)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, data.userId, data.type, data.provider, data.providerAccountId,
      data.refresh_token ?? null, data.access_token ?? null,
      data.expires_at ?? null, data.token_type ?? null,
      data.scope ?? null, data.id_token ?? null, data.session_state ?? null
    );
    return data as AdapterAccount;
  },

  unlinkAccount: async ({ provider, providerAccountId }: Pick<AdapterAccount, "provider" | "providerAccountId">) => {
    getDb().prepare("DELETE FROM accounts WHERE provider = ? AND providerAccountId = ?").run(provider, providerAccountId);
  },

  createSession: async (data) => {
    const db = getDb();
    const id = cuid();
    db.prepare("INSERT INTO sessions (id, sessionToken, userId, expires) VALUES (?, ?, ?, ?)").run(
      id, data.sessionToken, data.userId, data.expires.toISOString()
    );
    return data as AdapterSession;
  },

  getSessionAndUser: async (sessionToken) => {
    const db = getDb();
    const session = db.prepare("SELECT * FROM sessions WHERE sessionToken = ?").get(sessionToken) as Record<string, unknown> | undefined;
    if (!session) return null;
    const expires = new Date(session.expires as string);
    if (expires < new Date()) {
      db.prepare("DELETE FROM sessions WHERE sessionToken = ?").run(sessionToken);
      return null;
    }
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(session.userId as string) as Record<string, unknown> | undefined;
    if (!user) return null;
    return {
      session: { ...session, expires } as AdapterSession,
      user: { ...user, emailVerified: user.emailVerified ? new Date(user.emailVerified as string) : null } as AdapterUser,
    };
  },

  updateSession: async ({ sessionToken, expires }) => {
    const db = getDb();
    if (expires) {
      db.prepare("UPDATE sessions SET expires = ? WHERE sessionToken = ?").run(expires.toISOString(), sessionToken);
    }
    const row = db.prepare("SELECT * FROM sessions WHERE sessionToken = ?").get(sessionToken) as Record<string, unknown> | undefined;
    if (!row) return null;
    return { ...row, expires: new Date(row.expires as string) } as AdapterSession;
  },

  deleteSession: async (sessionToken) => {
    getDb().prepare("DELETE FROM sessions WHERE sessionToken = ?").run(sessionToken);
  },

  createVerificationToken: async (data) => {
    const db = getDb();
    db.prepare("INSERT OR REPLACE INTO verification_tokens (identifier, token, expires) VALUES (?, ?, ?)").run(
      data.identifier, data.token, data.expires.toISOString()
    );
    return data as VerificationToken;
  },

  useVerificationToken: async ({ identifier, token }) => {
    const db = getDb();
    const row = db.prepare("SELECT * FROM verification_tokens WHERE identifier = ? AND token = ?").get(identifier, token) as Record<string, unknown> | undefined;
    if (!row) return null;
    db.prepare("DELETE FROM verification_tokens WHERE identifier = ? AND token = ?").run(identifier, token);
    return { ...row, expires: new Date(row.expires as string) } as VerificationToken;
  },
};

export const authOptions: NextAuthOptions = {
  adapter: SQLiteAdapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "placeholder",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "placeholder",
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    session: async ({ session, user }) => {
      if (session?.user && user?.id) {
        (session.user as { id?: string }).id = user.id;
        try {
          const dbUser = userDb.findUnique({ id: user.id }) as Record<string, unknown> | undefined;
          (session.user as Record<string, unknown>).plan = dbUser?.plan ?? "FREE";
          (session.user as Record<string, unknown>).credits = dbUser?.credits ?? 0;
        } catch { /* non-blocking */ }
      }
      return session;
    },
  },
  pages: { signIn: "/auth/signin", error: "/auth/error" },
  session: { strategy: "database" },
  secret: process.env.NEXTAUTH_SECRET,
};
