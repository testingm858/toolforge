// POST /api/billing/webhook — Stripe webhook handler

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  // Lazy-load Stripe to avoid build-time errors without real keys
  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
      apiVersion: "2024-12-18.acacia" as never,
    });
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_placeholder") as never;
  } catch (err) {
    return NextResponse.json({ error: `Webhook error: ${(err as Error).message}` }, { status: 400 });
  }

  const obj = event.data.object;

  switch (event.type) {
    case "checkout.session.completed": {
      const userId = (obj.metadata as Record<string, string>)?.userId;
      const plan = (obj.metadata as Record<string, string>)?.plan as "PRO" | "ENTERPRISE";

      if (userId && plan) {
        const creditsMap: Record<string, number> = { PRO: 500, ENTERPRISE: 5000 };
        prisma.user.update({ where: { id: userId }, data: { plan, credits: creditsMap[plan] } });
        prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            stripeCustomerId: obj.customer as string,
            stripeSubscriptionId: obj.subscription as string,
            plan,
            status: "ACTIVE",
            creditsMonthly: creditsMap[plan],
          },
          update: {
            stripeCustomerId: obj.customer as string,
            stripeSubscriptionId: obj.subscription as string,
            plan,
            status: "ACTIVE",
            creditsMonthly: creditsMap[plan],
          },
        });
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const subId = obj.subscription as string;
      const sub = prisma.subscription.findFirst({ where: { stripeSubscriptionId: subId } }) as Record<string, unknown> | null;
      if (sub) {
        prisma.user.update({
          where: { id: sub.userId as string },
          data: { credits: sub.creditsMonthly as number },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = prisma.subscription.findFirst({ where: { stripeSubscriptionId: obj.id as string } }) as Record<string, unknown> | null;
      if (sub) {
        prisma.user.update({ where: { id: sub.userId as string }, data: { plan: "FREE", credits: 0 } });
        prisma.subscription.update({ where: { userId: sub.userId as string }, data: { status: "CANCELLED", plan: "FREE" } });
      }
      break;
    }

    case "invoice.payment_failed": {
      const subId = obj.subscription as string;
      const sub = prisma.subscription.findFirst({ where: { stripeSubscriptionId: subId } }) as Record<string, unknown> | null;
      if (sub) {
        prisma.subscription.update({ where: { userId: sub.userId as string }, data: { status: "PAST_DUE" } });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
