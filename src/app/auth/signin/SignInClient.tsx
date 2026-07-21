"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Zap } from "lucide-react";

function SignInInner({ googleConfigured }: { googleConfigured: boolean }) {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
        <div className="flex items-center justify-center gap-2 font-bold text-xl text-gray-900 mb-6">
          <Zap className="w-6 h-6 text-violet-600" />
          <span>ToolForge</span>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-2">Sign in</h1>
        <p className="text-gray-500 text-sm mb-8">
          Sign in to save your usage history and unlock Pro features.
        </p>

        <button
          onClick={() => signIn("google", { callbackUrl })}
          disabled={!googleConfigured}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue with Google
        </button>

        {!googleConfigured && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-3 mt-4 text-left">
            Google OAuth isn&apos;t configured yet on this deployment (placeholder
            credentials). Add real <code>GOOGLE_CLIENT_ID</code> /{" "}
            <code>GOOGLE_CLIENT_SECRET</code> values to <code>.env.local</code> to
            enable sign-in.
          </p>
        )}

        <p className="text-xs text-gray-400 mt-6">
          Free tools don&apos;t require an account.{" "}
          <Link href="/" className="text-violet-600 hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignInClient({ googleConfigured }: { googleConfigured: boolean }) {
  return (
    <Suspense fallback={null}>
      <SignInInner googleConfigured={googleConfigured} />
    </Suspense>
  );
}
