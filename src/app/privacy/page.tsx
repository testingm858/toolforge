import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How ToolForge collects, uses and protects your data.",
};

const LAST_UPDATED = "July 15, 2026";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mb-10">Last updated: {LAST_UPDATED}</p>

      <div className="space-y-8 text-gray-600 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">1. What we collect</h2>
          <p>
            Free tools that run entirely in your browser (most PDF, image, text and
            developer tools) never send your file or text content to our servers —
            it never leaves your device. Where a tool does require server
            processing, uploaded files are processed in memory and deleted within
            1 hour; we don&apos;t retain a copy.
          </p>
          <p className="mt-2">
            If you create an account, we store your name, email address, and — if
            you sign in with Google — the profile information Google shares with
            us under its OAuth consent flow. If you subscribe to a paid plan, Stripe
            processes your payment details directly; we never see or store your
            card number.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">2. How we use it</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To operate your account, enforce plan/usage limits, and track AI credit balances.</li>
            <li>To process billing through Stripe and keep your subscription status in sync.</li>
            <li>To measure aggregate, anonymized tool usage so we know what to improve.</li>
            <li>To respond if you contact support.</li>
          </ul>
          <p className="mt-2">We do not sell your personal data.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Third parties</h2>
          <p>
            We use Stripe for billing, Google for optional sign-in, and — for
            Pro/Enterprise AI tools — third-party AI providers (e.g. OpenAI,
            ElevenLabs) to process the specific request you submit to that tool.
            Each is bound by its own privacy terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Your rights</h2>
          <p>
            You can request a copy of your data or ask us to delete your account
            and associated data at any time by contacting us — see the{" "}
            <a href="/contact" className="text-violet-600 hover:underline">Contact</a> page.
            If you&apos;re in the EU/UK, this includes rights under GDPR (access,
            correction, deletion, portability, objection).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Cookies</h2>
          <p>
            We use a session cookie to keep you signed in and, if you use a paid
            plan, a Stripe cookie during checkout. We don&apos;t use third-party
            advertising trackers.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Contact</h2>
          <p>
            Questions about this policy? Reach us at{" "}
            <a href="mailto:privacy@toolforge.io" className="text-violet-600 hover:underline">
              privacy@toolforge.io
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
