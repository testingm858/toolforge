"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

function typeColor(value: JsonValue): string {
  if (value === null) return "text-gray-400";
  switch (typeof value) {
    case "string": return "text-green-600";
    case "number": return "text-blue-600";
    case "boolean": return "text-orange-600";
    default: return "text-gray-700";
  }
}

function formatPrimitive(value: JsonValue): string {
  if (value === null) return "null";
  if (typeof value === "string") return `"${value}"`;
  return String(value);
}

function isExpandable(value: JsonValue): value is JsonValue[] | { [key: string]: JsonValue } {
  return value !== null && typeof value === "object";
}

function preview(value: JsonValue[] | { [key: string]: JsonValue }): string {
  if (Array.isArray(value)) return `Array(${value.length})`;
  const keys = Object.keys(value);
  return `Object(${keys.length})`;
}

export default function JsonTreeNode({
  label,
  value,
  depth = 0,
  defaultOpen = true,
}: {
  label: string | null;
  value: JsonValue;
  depth?: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen || depth < 2);

  if (!isExpandable(value)) {
    return (
      <div className="font-mono text-xs leading-relaxed" style={{ paddingLeft: depth * 16 }}>
        {label !== null && <span className="text-violet-700">{label}: </span>}
        <span className={typeColor(value)}>{formatPrimitive(value)}</span>
      </div>
    );
  }

  const entries = Array.isArray(value)
    ? value.map((v, i) => [String(i), v] as const)
    : Object.entries(value);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 font-mono text-xs leading-relaxed hover:bg-gray-50 rounded w-full text-left"
        style={{ paddingLeft: depth * 16 }}
      >
        {open ? <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" /> : <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />}
        {label !== null && <span className="text-violet-700">{label}: </span>}
        <span className="text-gray-400">{preview(value)}</span>
      </button>
      {open && (
        <div>
          {entries.map(([key, v]) => (
            <JsonTreeNode key={key} label={key} value={v} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
