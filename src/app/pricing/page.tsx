"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Check, Zap } from "lucide-react";
import { PLANS } from "@/lib/stripe";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function PricingPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>(null);
  const [annual, setAnnual] = useState(false);

  const plans = [
    { key: "FREE",       ...PLANS.FREE       },
    { key: "PRO",        ...PLANS.PRO        },
    { key: "ENTERPRISE", ...PLANS.ENTERPRISE },
  ];

  async function handleUpgrade(planKey: string) {
    if (planKey === "FREE") return;
    if (!session) { window.location.assign("/auth/signin"); return; }

    setLoading(planKey);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planKey }),
    });
    const data = await res.json();
    if (data.url) window.location.assign(data.url);
    setLoading(null);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Simple, transparent pricing</h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto mb-8">
          Start free. Upgrade when you need AI superpowers. Cancel anytime.
        </p>

        {/* Annual toggle */}
        <div className="inline-flex items-center gap-3 bg-gray-100 p-1 rounded-full">
          <button
            onClick={() => setAnnual(false)}
            className={cn("px-4 py-1.5 rounded-full text-sm font-medium transition-all", !annual ? "bg-white shadow text-gray-900" : "text-gray-500")}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={cn("px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5", annual ? "bg-white shadow text-gray-900" : "text-gray-500")}
          >
            Annual <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">-20%</span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isPopular = plan.key === "PRO";
          const price = annual && plan.price > 0
            ? Math.round(plan.price * 0.8 * 10) / 10
            : plan.price;

          return (
            <div
              key={plan.key}
              className={cn(
                "relative bg-white rounded-2xl border p-6 flex flex-col",
                isPopular ? "border-violet-400 shadow-lg shadow-violet-100 ring-2 ring-violet-400" : "border-gray-200"
              )}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-violet-600 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h2>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-gray-900">
                    {price === 0 ? "Free" : `$${price}`}
                  </span>
                  {price > 0 && <span className="text-gray-400 text-sm">/mo{annual ? " billed annually" : ""}</span>}
                </div>
                {plan.key !== "FREE" && (
                  <p className="text-xs text-violet-600 font-medium mt-1">14-day free trial</p>
                )}
              </div>

              <ul className="space-y-3 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {plan.key === "FREE" ? (
                <Link href="/tools" className="block text-center bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
                  Get Started Free
                </Link>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.key)}
                  disabled={loading === plan.key}
                  className={cn(
                    "w-full py-3 rounded-xl font-semibold transition-colors",
                    isPopular
                      ? "bg-violet-600 text-white hover:bg-violet-700"
                      : "bg-gray-900 text-white hover:bg-gray-800",
                    "disabled:opacity-60"
                  )}
                >
                  {loading === plan.key ? "Redirecting..." : `Start ${plan.name} Trial`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="mt-20">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Pricing FAQ</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { q: "Do I need a credit card to start?", a: "No. The free plan requires no card. The Pro trial also starts without a card — you're only charged after 14 days." },
            { q: "What are AI credits?", a: "Credits are consumed when you use AI tools. Pro gets 500/month, Enterprise gets 5,000/month. They reset on your billing date." },
            { q: "Can I cancel anytime?", a: "Yes, cancel with one click from your dashboard. You keep Pro access until the end of your billing period." },
            { q: "Are free tools really free?", a: "Yes. 121 tools are permanently free with no account required. No trial expiry, no hidden limits that switch on." },
          ].map((faq) => (
            <div key={faq.q} className="bg-white border border-gray-100 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
              <p className="text-sm text-gray-500">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
