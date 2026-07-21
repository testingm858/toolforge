// ─── Billing Agent — Stripe ───────────────────────────────────────────────────

import { FREE_TOOLS, AI_TOOLS } from "./tools";

export const PLANS = {
  FREE: {
    name: "Free",
    price: 0,
    priceId: null as string | null,
    credits: 0,
    dailyLimit: 10,
    maxFileMB: 10,
    features: [
      `${FREE_TOOLS.length} free tools — unlimited categories`,
      "10 uses per tool per day",
      "Up to 10MB file uploads",
      "Standard processing speed",
    ],
  },
  PRO: {
    name: "Pro",
    price: 12,
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? null,
    credits: 500,
    dailyLimit: 9999,
    maxFileMB: 100,
    features: [
      "Everything in Free",
      `All ${AI_TOOLS.length} AI-powered tools`,
      "500 AI credits per month",
      "Unlimited free tool usage",
      "Up to 100MB file uploads",
      "Priority processing",
      "30-day usage history",
    ],
  },
  ENTERPRISE: {
    name: "Enterprise",
    price: 79,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID ?? null,
    credits: 5000,
    dailyLimit: 9999,
    maxFileMB: 500,
    features: [
      "Everything in Pro",
      "5,000 AI credits per month",
      "API access + SDKs",
      "Up to 500MB file uploads",
      "Highest priority queue",
      "Team workspace",
      "SSO (SAML/Google)",
      "Dedicated account manager",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;

// Lazy-load Stripe only when actually called (avoids build errors without real keys)
async function getStripe() {
  const { default: Stripe } = await import("stripe");
  return new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
    apiVersion: "2024-12-18.acacia" as never,
    typescript: true,
  });
}

export async function createCheckoutSession(
  userId: string,
  email: string,
  planKey: "PRO" | "ENTERPRISE"
): Promise<string> {
  const stripe = await getStripe();
  const plan = PLANS[planKey];
  if (!plan.priceId) throw new Error("Stripe price ID not configured");

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: email,
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
    metadata: { userId, plan: planKey },
    subscription_data: { trial_period_days: 14, metadata: { userId, plan: planKey } },
    allow_promotion_codes: true,
  });

  return session.url!;
}

export async function createPortalSession(customerId: string): Promise<string> {
  const stripe = await getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_URL}/dashboard`,
  });
  return session.url;
}
