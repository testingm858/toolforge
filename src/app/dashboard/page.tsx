import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PLANS, type PlanKey } from "@/lib/stripe";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    redirect("/auth/signin?callbackUrl=/dashboard");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const subscription = await prisma.subscription.findUnique({ where: { userId } });

  const planKey = (user?.plan as PlanKey) ?? "FREE";
  const plan = PLANS[planKey] ?? PLANS.FREE;

  return (
    <DashboardClient
      email={session?.user?.email ?? ""}
      planKey={planKey}
      planName={plan.name}
      credits={user?.credits ?? 0}
      creditsMonthly={plan.credits}
      hasBillingAccount={!!subscription?.stripeCustomerId}
    />
  );
}
