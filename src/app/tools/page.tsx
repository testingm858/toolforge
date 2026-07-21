import type { Metadata } from "next";
import { Suspense } from "react";
import { ALL_TOOLS } from "@/lib/tools";
import ToolsListClient from "./ToolsListClient";

export const metadata: Metadata = {
  title: "All Tools",
  description: `Browse all ${ALL_TOOLS.length} tools on ToolForge, searchable by name or category.`,
};

export default function AllToolsPage() {
  return (
    <Suspense fallback={null}>
      <ToolsListClient />
    </Suspense>
  );
}
