import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getToolsByCategory, CATEGORY_META, ToolCategory } from "@/lib/tools";
import ToolCard from "@/components/ToolCard";

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  return Object.keys(CATEGORY_META).map((category) => ({ category }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const meta = CATEGORY_META[category];
  if (!meta) return {};
  return {
    title: `${meta.label} — Free Online Tools`,
    description: meta.description,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const meta = CATEGORY_META[category];
  if (!meta) notFound();

  const tools = getToolsByCategory(category as ToolCategory);
  const isPremiumCat = category.startsWith("ai-");

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-5xl">{meta.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-gray-900">{meta.label}</h1>
              {isPremiumCat && (
                <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold">PRO</span>
              )}
            </div>
            <p className="text-gray-500 mt-1">{meta.description}</p>
          </div>
        </div>
        <p className="text-sm text-gray-400 mt-2">{tools.length} tools in this category</p>
      </div>

      {/* Tools grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  );
}
