import type { Metadata } from "next";
import Link from "next/link";
import { Zap, Shield, Star } from "lucide-react";
import { FREE_TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
  title: "About",
  description: "Why ToolForge exists and how it's built.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">About ToolForge</h1>
      <p className="text-gray-600 leading-relaxed mb-6">
        ToolForge bundles {FREE_TOOLS.length}{" "}
        everyday tools into one place — free utilities that run without an
        account. The idea is simple: most
        &quot;online tool&quot; sites make you hunt across a dozen ad-choked
        pages for a PDF merger, a JSON formatter, a BMI calculator. We wanted
        one place, fast, with a free tier that&apos;s actually useful on its
        own.
      </p>
      <p className="text-gray-600 leading-relaxed mb-10">
        Tools that can run in your browser do — nothing about your file or
        text content touches our servers.
      </p>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {[
          { icon: <Zap className="w-5 h-5 text-violet-600" />, title: "Fast", desc: "Most tools process instantly, client-side." },
          { icon: <Shield className="w-5 h-5 text-green-600" />, title: "Private", desc: "We don't store your files or content." },
          { icon: <Star className="w-5 h-5 text-amber-500" />, title: "Honest free tier", desc: "No trial expiry on free tools, ever." },
        ].map((f) => (
          <div key={f.title} className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center mb-3">{f.icon}</div>
            <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
            <p className="text-sm text-gray-500">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 text-white rounded-2xl p-8 text-center">
        <h2 className="text-xl font-bold mb-2">Have a tool you wish existed?</h2>
        <p className="text-gray-400 text-sm mb-5">Tell us — we&apos;re always adding to the catalog.</p>
        <Link href="/contact" className="inline-block bg-violet-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-violet-700 transition-colors">
          Get in touch
        </Link>
      </div>
    </div>
  );
}
