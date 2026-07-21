"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { ALL_TOOLS, CATEGORY_META, type ToolCategory } from "@/lib/tools";
import ToolCard from "@/components/ToolCard";
import { cn } from "@/lib/utils";

type PlanFilter = "all" | "free" | "premium";

export default function ToolsListClient() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState<ToolCategory | "all">("all");
  const [plan, setPlan] = useState<PlanFilter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_TOOLS.filter((tool) => {
      if (category !== "all" && tool.category !== category) return false;
      if (plan === "free" && tool.isPremium) return false;
      if (plan === "premium" && !tool.isPremium) return false;
      if (!q) return true;
      return (
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.tags?.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [query, category, plan]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">All Tools</h1>
        <p className="text-gray-500 mt-1">{ALL_TOOLS.length} tools — search or filter to find what you need</p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tools..."
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-violet-400"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-full mr-2">
          {(["all", "free", "premium"] as PlanFilter[]).map((p) => (
            <button
              key={p}
              onClick={() => setPlan(p)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize",
                plan === p ? "bg-white shadow text-gray-900" : "text-gray-500"
              )}
            >
              {p}
            </button>
          ))}
        </div>

        <button
          onClick={() => setCategory("all")}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
            category === "all" ? "bg-violet-600 text-white border-violet-600" : "bg-white text-gray-600 border-gray-200 hover:border-violet-300"
          )}
        >
          All categories
        </button>
        {Object.entries(CATEGORY_META).map(([key, meta]) => (
          <button
            key={key}
            onClick={() => setCategory(key as ToolCategory)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              category === key ? "bg-violet-600 text-white border-violet-600" : "bg-white text-gray-600 border-gray-200 hover:border-violet-300"
            )}
          >
            <span>{meta.icon}</span>
            {meta.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-16">No tools match your search.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      )}
    </div>
  );
}
