"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, CreditCard } from "lucide-react";
import type { PlanKey } from "@/lib/stripe";

interface Props {
  email: string;
  planKey: PlanKey;
  planName: string;
  credits: number;
  creditsMonthly: number;
  hasBillingAccount: boolean;
}

export default function DashboardClient({ email, planKey, planName, credits, creditsMonthly, hasBillingAccount }: Props) {
  const [loading, setLoading] = useState(false);

  async function openBillingPortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.assign(data.url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-gray-500 text-sm mb-8">{email}</p>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            <Zap className="w-3.5 h-3.5" /> Plan
          </div>
          <div className="text-2xl font-bold text-gray-900">{planName}</div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">AI Credits</div>
          <div className="text-2xl font-bold text-gray-900">
            {credits} <span className="text-gray-400 text-base font-normal">/ {creditsMonthly} monthly</span>
          </div>
        </div>
      </div>

      {planKey !== "FREE" && hasBillingAccount && (
        <button
          onClick={openBillingPortal}
          disabled={loading}
          className="flex items-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-60"
        >
          <CreditCard className="w-4 h-4" />
          {loading ? "Opening..." : "Manage billing"}
        </button>
      )}

      <div className="mt-10 pt-8 border-t border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Quick links</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/tools" className="text-sm bg-white border border-gray-200 px-4 py-2 rounded-lg hover:border-violet-300 transition-colors">
            Browse all tools
          </Link>
        </div>
      </div>
    </div>
  );
}
