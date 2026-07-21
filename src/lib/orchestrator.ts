// ─── Master Orchestrator Agent ───────────────────────────────────────────────
// Central routing brain. Every tool request passes through here.

import { NextRequest, NextResponse } from "next/server";
import { getToolById } from "./tools";
import { getUsageCount, incrementUsage } from "./redis";

export type UserPlan = "FREE" | "PRO" | "ENTERPRISE";

export interface OrchestratorContext {
  userId?: string;
  identifier: string;
  plan: UserPlan;
  creditsRemaining: number;
}

const PLAN_LIMITS: Record<UserPlan, { dailyUses: number; maxFileSizeMB: number }> = {
  FREE:       { dailyUses: 10,       maxFileSizeMB: 10  },
  PRO:        { dailyUses: 9999,     maxFileSizeMB: 100 },
  ENTERPRISE: { dailyUses: 9999,     maxFileSizeMB: 500 },
};

const ANON_DAILY_LIMIT = 3;

// ─── Resolve session lazily to avoid build-time import issues ─────────────────
async function getSession(_req: NextRequest) {
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("./auth");
    return await getServerSession(authOptions);
  } catch {
    return null;
  }
}

async function getUserFromDb(userId: string) {
  try {
    const { default: prisma } = await import("./prisma");
    return await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, credits: true },
    });
  } catch {
    return null;
  }
}

// ─── Main gate ────────────────────────────────────────────────────────────────

export async function orchestrate(
  req: NextRequest,
  toolId: string
): Promise<{ allowed: boolean; ctx: OrchestratorContext; error?: NextResponse }> {
  const tool = getToolById(toolId);
  if (!tool) {
    return {
      allowed: false,
      ctx: buildAnonCtx(req),
      error: NextResponse.json({ error: "Tool not found" }, { status: 404 }),
    };
  }

  const session = await getSession(req);
  const userId = (session?.user as { id?: string })?.id;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const identifier = userId ?? `ip:${ip}`;

  let plan: UserPlan = "FREE";
  let creditsRemaining = 0;

  if (userId) {
    const user = await getUserFromDb(userId);
    if (user) {
      plan = (user.plan as UserPlan) ?? "FREE";
      creditsRemaining = (user.credits as number) ?? 0;
    }
  }

  const ctx: OrchestratorContext = { userId, identifier, plan, creditsRemaining };

  // Block AI tools for free users
  if (tool.isPremium && plan === "FREE") {
    return {
      allowed: false,
      ctx,
      error: NextResponse.json(
        { error: "premium_required", message: "This is a Pro feature. Upgrade to unlock all AI tools.", upgradeUrl: "/pricing" },
        { status: 403 }
      ),
    };
  }

  // Check daily limit
  const limit = userId ? PLAN_LIMITS[plan].dailyUses : ANON_DAILY_LIMIT;
  const usage = await getUsageCount(identifier, toolId);

  if (usage >= limit) {
    return {
      allowed: false,
      ctx,
      error: NextResponse.json(
        {
          error: "rate_limited",
          message: userId
            ? `Daily limit of ${limit} reached. Upgrade to Pro for unlimited access.`
            : `Sign in to get ${PLAN_LIMITS.FREE.dailyUses} daily uses per tool.`,
          upgradeUrl: "/pricing",
          loginUrl: "/auth/signin",
        },
        { status: 429 }
      ),
    };
  }

  // Check AI credits
  if (tool.isPremium && tool.creditsPerUse && creditsRemaining < tool.creditsPerUse) {
    return {
      allowed: false,
      ctx,
      error: NextResponse.json(
        { error: "insufficient_credits", message: `This tool costs ${tool.creditsPerUse} credits. You have ${creditsRemaining}.`, upgradeUrl: "/pricing" },
        { status: 402 }
      ),
    };
  }

  return { allowed: true, ctx };
}

// ─── Log usage ────────────────────────────────────────────────────────────────

export async function logUsage(
  ctx: OrchestratorContext,
  toolId: string,
  category: string,
  latencyMs: number,
  success: boolean,
  creditsUsed = 0,
  errorMessage?: string
): Promise<void> {
  await incrementUsage(ctx.identifier, toolId);

  // Fire-and-forget DB logging
  if (creditsUsed > 0 && ctx.userId) {
    try {
      const { default: prisma } = await import("./prisma");
      await prisma.user.update({ where: { id: ctx.userId }, data: { credits: { decrement: creditsUsed } } });
    } catch { /* non-blocking */ }
  }

  try {
    const { default: prisma } = await import("./prisma");
    await prisma.toolUsage.create({
      data: { userId: ctx.userId, toolId, category, plan: ctx.plan, latencyMs, success, creditsUsed, errorMessage },
    });
  } catch { /* non-blocking */ }
}

function buildAnonCtx(req: NextRequest): OrchestratorContext {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return { identifier: `ip:${ip}`, plan: "FREE", creditsRemaining: 0 };
}
