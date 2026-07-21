// ─── Auth Agent — NextAuth v4 with the official Prisma adapter ───────────────
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { plan: true, credits: true },
          });
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
