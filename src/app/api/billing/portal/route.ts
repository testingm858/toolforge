// POST /api/billing/portal — create Stripe billing-portal session for the signed-in user

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createPortalSession } from "@/lib/stripe";
import prisma from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const subscription = prisma.subscription.findUnique({ where: { userId } }) as { stripeCustomerId?: string } | null;
  if (!subscription?.stripeCustomerId) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
  }

  const url = await createPortalSession(subscription.stripeCustomerId);
  return NextResponse.json({ url });
}
