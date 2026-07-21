import Link from "next/link";
import { ArrowRight, Zap, Shield, Star, Users, Gauge } from "lucide-react";
import { FREE_TOOLS, CATEGORY_META } from "@/lib/tools";
import ToolCard from "@/components/ToolCard";
import HeroSearch from "@/components/HeroSearch";

const FEATURED_FREE = [
  "pdf-merge", "pdf-compress", "image-compress", "json-formatter",
  "password-generator", "qr-generator", "bmi-calculator", "hex-to-rgb",
  "word-counter", "uuid-generator", "regex-tester", "loan-calculator",
];

const STATS = [
  { value: String(FREE_TOOLS.length), label: "Free tools", icon: Zap },
  { value: "0", label: "Signup required", icon: Users },
  { value: "0", label: "Cost, ever", icon: Star },
  { value: "<1s", label: "Typical run time", icon: Gauge },
];

export default function HomePage() {
  const featuredFree = FREE_TOOLS.filter((t) => FEATURED_FREE.includes(t.id));
  const categories   = Object.entries(CATEGORY_META).filter(([k]) => !k.startsWith("ai-"));

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-white border-b border-gray-100">
        {/* Decorative gradient blobs — pure CSS, no images/JS */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-32 w-96 h-96 bg-violet-200/40 rounded-full blur-3xl" />
          <div className="absolute -top-16 right-0 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl" />
          <div className="absolute top-40 left-1/3 w-72 h-72 bg-fuchsia-100/30 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6 ring-1 ring-violet-100">
            <Zap className="w-4 h-4" />
            {FREE_TOOLS.length} free tools, no signup required
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6 leading-tight">
            Every tool you need,<br />
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">in one place</span>
          </h1>

          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            PDF tools, image converters, audio tools, developer utilities, calculators and more.
            Free forever, no account required.
          </p>

          <HeroSearch />

          <div className="flex flex-wrap items-center justify-center gap-2 mt-6 mb-16">
            {categories.slice(0, 6).map(([key, meta]) => (
              <Link
                key={key}
                href={`/category/${key}`}
                className="flex items-center gap-1.5 bg-white border border-gray-200 hover:border-violet-300 hover:bg-violet-50 text-gray-600 hover:text-violet-700 text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
              >
                <span>{meta.icon}</span>
                {meta.label}
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1.5 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-100 py-4 px-2">
                <s.icon className="w-4 h-4 text-violet-500" />
                <div className="text-2xl font-extrabold text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-500 text-center leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free Tool Categories */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Free Tools</h2>
            <p className="text-gray-500 text-sm mt-1">{FREE_TOOLS.length} tools · No account required</p>
          </div>
          <Link href="/tools" className="hidden sm:flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-700 font-semibold">
            Browse all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {categories.map(([key, meta]) => (
            <Link
              key={key}
              href={`/category/${key}`}
              className="group flex items-center gap-3 bg-white border border-gray-100 hover:border-violet-200 hover:shadow-md rounded-2xl p-4 transition-all"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 group-hover:bg-violet-50 text-xl transition-colors shrink-0">
                {meta.icon}
              </span>
              <div className="min-w-0">
                <div className="font-semibold text-gray-900 text-sm group-hover:text-violet-700 transition-colors truncate">{meta.label}</div>
                <div className="text-gray-400 text-xs">{FREE_TOOLS.filter(t => t.category === key).length} tools</div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {featuredFree.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>

        <div className="text-center mt-8">
          <Link href="/tools" className="text-sm text-violet-600 hover:text-violet-700 font-medium">
            View all {FREE_TOOLS.length} free tools
          </Link>
        </div>
      </section>

      {/* Why ToolForge */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why ToolForge?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: <Zap className="w-6 h-6 text-white" />, gradient: "from-violet-500 to-purple-500", title: "Lightning Fast", desc: "Most tools process in your browser instantly - no waiting, no server round trips." },
            { icon: <Shield className="w-6 h-6 text-white" />, gradient: "from-emerald-500 to-teal-500", title: "Privacy First", desc: "Files processed locally where possible. We never store your data. GDPR compliant." },
            { icon: <Star className="w-6 h-6 text-white" />, gradient: "from-amber-500 to-orange-500", title: "Free Forever", desc: `${FREE_TOOLS.length} tools are completely free with no account required. The free tier is genuinely useful.` },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all">
              <div className={`w-12 h-12 bg-gradient-to-br ${f.gradient} rounded-xl flex items-center justify-center mb-4 shadow-sm`}>{f.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative overflow-hidden bg-gray-900 text-white py-16">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-gray-400 mb-8">Jump into any tool right now — no signup, no credit card.</p>
          <Link href="/tools" className="inline-flex items-center gap-2 bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-violet-900/50 transition-shadow">
            Browse All Tools <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
