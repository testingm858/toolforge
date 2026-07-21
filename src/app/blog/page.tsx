import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog",
  description: "Tips, tool guides and product updates from ToolForge.",
};

export default function BlogPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <Newspaper className="w-10 h-10 text-gray-300 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Nothing here yet</h1>
      <p className="text-gray-500 mb-8">
        We&apos;re working on guides for getting the most out of ToolForge&apos;s
        tools. Check back soon — or see what shipped recently on the{" "}
        <Link href="/changelog" className="text-violet-600 hover:underline">changelog</Link>.
      </p>
      <Link href="/tools" className="inline-block bg-violet-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-violet-700 transition-colors">
        Browse tools instead
      </Link>
    </div>
  );
}
