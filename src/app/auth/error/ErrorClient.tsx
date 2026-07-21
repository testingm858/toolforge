"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

const MESSAGES: Record<string, string> = {
  Configuration: "There's a problem with the server's auth configuration. Try again later.",
  AccessDenied: "Access was denied for this sign-in attempt.",
  Verification: "That sign-in link is no longer valid — it may have expired or already been used.",
  OAuthSignin: "Couldn't start the sign-in flow with that provider.",
  OAuthCallback: "The sign-in provider returned an error. This usually means the OAuth credentials aren't configured correctly yet.",
  OAuthCreateAccount: "Couldn't create an account from that sign-in provider.",
  Default: "Something went wrong during sign-in. Please try again.",
};

export default function ErrorClient() {
  const params = useSearchParams();
  const code = params.get("error") ?? "Default";
  const message = MESSAGES[code] ?? MESSAGES.Default;

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="bg-white border border-gray-100 rounded-2xl p-8">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Sign-in error</h1>
        <p className="text-gray-500 text-sm mb-8">{message}</p>
        <Link
          href="/auth/signin"
          className="inline-block bg-violet-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-violet-700 transition-colors"
        >
          Try again
        </Link>
      </div>
    </div>
  );
}
