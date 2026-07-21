"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, Zap } from "lucide-react";
import { CATEGORY_META } from "@/lib/tools";

const TOOL_CATS = ["pdf", "image", "audio", "developer", "seo", "writing", "calculator", "design"];

export default function Navbar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <nav className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2 font-bold text-xl text-gray-900 shrink-0">
          <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 shadow-sm shadow-violet-200 group-hover:shadow-violet-300 transition-shadow">
            <Zap className="w-4 h-4 text-white" fill="currentColor" />
          </span>
          <span>ToolForge</span>
        </Link>

        {/* Desktop nav — all 8 categories as direct links */}
        <div className="hidden lg:flex flex-1 min-w-0 items-center gap-0.5 overflow-x-auto">
          {TOOL_CATS.map((cat) => (
            <Link
              key={cat}
              href={`/category/${cat}`}
              className="group whitespace-nowrap shrink-0 flex items-center gap-1.5 px-2.5 py-2 text-sm text-gray-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors"
            >
              <span className="text-base leading-none opacity-80 group-hover:opacity-100 transition-opacity">{CATEGORY_META[cat]?.icon}</span>
              <span>{CATEGORY_META[cat]?.label}</span>
            </Link>
          ))}
        </div>

        {/* Right: Auth */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {session ? (
            <>
              <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">Dashboard</Link>
              <button onClick={() => signOut()} className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">Sign out</button>
            </>
          ) : (
            <>
              <Link href="/auth/signin" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                Sign in
              </Link>
              <Link href="/auth/signin?intent=signup" className="text-sm bg-gradient-to-br from-violet-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-sm shadow-violet-200 hover:shadow-violet-300 transition-shadow font-medium">
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile burger */}
        <button className="lg:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-1">
          {TOOL_CATS.map((cat) => (
            <Link
              key={cat}
              href={`/category/${cat}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-violet-600 rounded-lg hover:bg-violet-50 transition-colors"
            >
              <span>{CATEGORY_META[cat]?.icon}</span>
              <span>{CATEGORY_META[cat]?.label}</span>
            </Link>
          ))}
          <div className="pt-2 border-t border-gray-100 mt-2 space-y-1">
            {session
              ? <>
                  <Link href="/dashboard" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm text-gray-600">Dashboard</Link>
                  <button onClick={() => signOut()} className="block w-full text-left px-3 py-2 text-sm text-gray-600">Sign out</button>
                </>
              : <>
                  <Link href="/auth/signin" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm text-gray-600 font-medium">Sign in</Link>
                  <Link href="/auth/signin?intent=signup" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm text-violet-600 font-semibold">Sign up</Link>
                </>
            }
          </div>
        </div>
      )}
    </header>
  );
}
