import type { Metadata } from "next";
import { ALL_TOOLS, FREE_TOOLS, AI_TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Changelog",
  description: "What's new on ToolForge.",
};

const ENTRIES = [
  {
    date: "2026-07-15",
    title: "Launch",
    items: [
      `${ALL_TOOLS.length} tools live — ${FREE_TOOLS.length} free, ${AI_TOOLS.length} Pro/AI-powered.`,
      "Google sign-in, Stripe billing (Pro & Enterprise plans, 14-day trial).",
      "Searchable tool directory at /tools.",
      "Per-tool daily usage limits for free/anonymous use; AI credit metering for Pro.",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-10">Changelog</h1>

      <div className="space-y-10">
        {ENTRIES.map((entry) => (
          <div key={entry.date} className="border-l-2 border-violet-200 pl-6">
            <p className="text-xs text-gray-400 font-medium mb-1">{entry.date}</p>
            <h2 className="text-lg font-bold text-gray-900 mb-3">{entry.title}</h2>
            <ul className="space-y-1.5">
              {entry.items.map((item) => (
                <li key={item} className="text-sm text-gray-600 flex gap-2">
                  <span className="text-violet-400">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
