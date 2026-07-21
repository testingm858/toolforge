"use client";

import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import JsonTreeNode from "./JsonTreeNode";

// Runs entirely in the browser — JSON.parse + tree rendering needs no
// server round-trip at all.
export default function JsonViewerClient() {
  const [input, setInput] = useState("");

  const parsed = useMemo(() => {
    if (!input.trim()) return { ok: false as const, error: null };
    try {
      return { ok: true as const, value: JSON.parse(input) };
    } catch (err) {
      return { ok: false as const, error: (err as Error).message };
    }
  }, [input]);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
          <span className="text-sm font-medium text-gray-600">Paste your JSON here</span>
          <button onClick={() => setInput("")} className="text-gray-400 hover:text-gray-600 transition-colors" title="Clear">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
        <textarea
          className="w-full p-4 text-sm font-mono resize-none focus:outline-none text-gray-800 min-h-[180px]"
          placeholder={'{\n  "name": "John",\n  "tags": ["a", "b"],\n  "address": { "city": "NYC" }\n}'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
        />
      </div>

      {input.trim() && !parsed.ok && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
          Invalid JSON: {parsed.error}
        </div>
      )}

      {parsed.ok && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 overflow-x-auto">
          <JsonTreeNode label={null} value={parsed.value} />
        </div>
      )}
    </div>
  );
}
