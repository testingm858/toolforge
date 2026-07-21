"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";

export default function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/tools?q=${encodeURIComponent(q)}` : "/tools");
  }

  return (
    <form onSubmit={handleSubmit} className="relative max-w-xl mx-auto">
      <Search className="pointer-events-none absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search 115 tools — PDF merge, QR code, JSON formatter..."
        className="w-full pl-11 sm:pl-12 pr-14 sm:pr-32 py-3.5 sm:py-4 rounded-2xl border border-gray-200 bg-white shadow-sm text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-shadow"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 flex items-center justify-center gap-1.5 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-colors w-9 h-9 sm:w-auto sm:h-auto sm:px-5 sm:py-2.5 text-sm"
      >
        <span className="hidden sm:inline">Search</span>
        <ArrowRight className="w-4 h-4 sm:hidden" />
      </button>
    </form>
  );
}
