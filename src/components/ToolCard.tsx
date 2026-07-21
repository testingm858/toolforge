import Link from "next/link";
import { Lock } from "lucide-react";
import { Tool } from "@/lib/tools";
import { cn } from "@/lib/utils";

export default function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      href={`/tools/${tool.id}`}
      className={cn(
        "group relative flex flex-col gap-2 p-4 rounded-xl border transition-all duration-200",
        "bg-white hover:shadow-md hover:-translate-y-0.5",
        tool.isPremium
          ? "border-violet-100 hover:border-violet-300"
          : "border-gray-100 hover:border-gray-200"
      )}
    >
      {/* Premium badge */}
      {tool.isPremium && (
        <span className="absolute top-3 right-3 flex items-center gap-1 text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-semibold">
          <Lock className="w-3 h-3" /> PRO
        </span>
      )}
      {tool.isNew && (
        <span className="absolute top-3 right-3 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
          NEW
        </span>
      )}

      {/* Icon + name */}
      <div className="flex items-center gap-3">
        <span className="text-2xl leading-none">{tool.icon}</span>
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-violet-600 transition-colors leading-tight">
          {tool.name}
        </h3>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
        {tool.description}
      </p>

      {/* Credit badge for AI tools */}
      {tool.creditsPerUse && (
        <span className="text-xs text-violet-500 font-medium mt-auto">
          {tool.creditsPerUse} credits / use
        </span>
      )}
    </Link>
  );
}
