// POST /api/billing/checkout — create Stripe checkout session

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createCheckoutSession } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { plan } = await req.json();
  if (!["PRO", "ENTERPRISE"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const url = await createCheckoutSession(
    (session.user as { id?: string }).id as string,
    session.user.email,
    plan as "PRO" | "ENTERPRISE"
  );

  return NextResponse.json({ url });
}
