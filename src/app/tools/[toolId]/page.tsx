import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getToolById, ALL_TOOLS, AI_TOOLS, CATEGORY_META } from "@/lib/tools";
import { isFileTool } from "@/lib/file-tools";
import ToolCard from "@/components/ToolCard";
import ToolInterface from "@/components/ToolInterface";
import FileToolInterface from "@/components/FileToolInterface";
import WebhookTesterClient from "@/components/WebhookTesterClient";
import JsonViewerClient from "@/components/JsonViewerClient";
import { Lock } from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ toolId: string }>;
}

export async function generateStaticParams() {
  return ALL_TOOLS.map((tool) => ({ toolId: tool.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { toolId } = await params;
  const tool = getToolById(toolId);
  if (!tool) return {};
  return {
    title: `${tool.name} — Free Online Tool`,
    description: tool.description,
    keywords: tool.tags ?? [],
    openGraph: { title: `${tool.name} | ToolForge`, description: tool.description },
  };
}

export default async function ToolPage({ params }: Props) {
  const { toolId } = await params;
  const tool = getToolById(toolId);
  if (!tool) notFound();

  const catMeta = CATEGORY_META[tool.category];
  const relatedTools = ALL_TOOLS.filter((t) => t.category === tool.category && t.id !== tool.id).slice(0, 6);

  let hasPremiumAccess = false;
  let userCredits = 0;
  if (tool.isPremium) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      hasPremiumAccess = user?.plan === "PRO" || user?.plan === "ENTERPRISE";
      userCredits = user?.credits ?? 0;
    }
  }
  const needsUpgrade = tool.isPremium && !hasPremiumAccess;
  const needsCredits = tool.isPremium && hasPremiumAccess && !!tool.creditsPerUse && userCredits < tool.creditsPerUse;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-gray-600">Home</Link>
        <span>/</span>
        <Link href={`/category/${tool.category}`} className="hover:text-gray-600">{catMeta?.label}</Link>
        <span>/</span>
        <span className="text-gray-700">{tool.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">{tool.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{tool.name}</h1>
              {tool.isPremium && (
                <span className="flex items-center gap-1 text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold">
                  <Lock className="w-3 h-3" /> PRO
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-0.5">{tool.description}</p>
          </div>
        </div>
      </div>

      {/* Premium gate */}
      {needsUpgrade ? (
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-2xl p-10 text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">This is a Pro tool</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Unlock <strong>{tool.name}</strong> and {AI_TOOLS.length - 1} other AI-powered tools with a Pro subscription.
            {tool.creditsPerUse && ` This tool costs ${tool.creditsPerUse} credits per use.`}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/pricing" className="bg-violet-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-violet-700 transition-colors">
              Upgrade to Pro — $12/mo
            </Link>
            <Link href="/auth/signin" className="bg-white text-gray-700 border border-gray-200 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
              Sign in
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-4">14-day free trial · No credit card required</p>
        </div>
      ) : needsCredits ? (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-10 text-center">
          <div className="text-4xl mb-4">⚡</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Out of AI credits</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {tool.name} costs {tool.creditsPerUse} credits per use — you have {userCredits} left this period.
            Credits reset on your next billing date, or upgrade for a bigger monthly allowance.
          </p>
          <Link href="/pricing" className="inline-block bg-violet-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-violet-700 transition-colors">
            View plans
          </Link>
        </div>
      ) : tool.id === "webhook-tester" ? (
        <WebhookTesterClient />
      ) : tool.id === "json-viewer" ? (
        <JsonViewerClient />
      ) : isFileTool(tool.id) ? (
        <FileToolInterface tool={tool} />
      ) : (
        /* Tool interface */
        <ToolInterface tool={tool} />
      )}

      {/* Related tools */}
      {relatedTools.length > 0 && (
        <div className="mt-14">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Related {catMeta?.label}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {relatedTools.map((t) => <ToolCard key={t.id} tool={t} />)}
          </div>
        </div>
      )}

      {/* SEO FAQ */}
      <div className="mt-14 border-t border-gray-100 pt-10">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {[
            { q: `Is ${tool.name} free?`, a: tool.isPremium ? "This is a Pro tool available with our $12/month plan." : "Yes! This tool is completely free with no account required." },
            { q: `Is my data safe when using ${tool.name}?`, a: "Yes. We process files locally in your browser where possible. Files uploaded to our servers are deleted within 1 hour." },
            { q: `What file formats does ${tool.name} support?`, a: "Please refer to the tool interface above for supported formats and options." },
          ].map((faq, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
              <p className="text-gray-500 text-sm">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
