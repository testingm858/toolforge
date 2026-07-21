import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of ToolForge.",
};

const LAST_UPDATED = "July 15, 2026";

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-400 mb-10">Last updated: {LAST_UPDATED}</p>

      <div className="space-y-8 text-gray-600 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Using ToolForge</h2>
          <p>
            Free tools require no account and are available for personal and
            commercial use, subject to the daily usage limits shown on each tool.
            Pro and Enterprise plans unlock AI-powered tools, higher limits and
            larger file uploads for the duration of an active subscription.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Your content</h2>
          <p>
            You retain all rights to files and text you submit to a tool. We
            claim no ownership over it. Server-processed files are deleted
            within 1 hour of processing; we don&apos;t use your content to train
            models.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Acceptable use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Use the service for anything illegal, or to process content you don&apos;t have the rights to.</li>
            <li>Attempt to circumvent plan limits, rate limits, or credit metering.</li>
            <li>Reverse-engineer, scrape, or resell access to the service without our written permission.</li>
            <li>Use AI tools to generate content that is abusive, deceptive, or violates a third party&apos;s rights.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Billing</h2>
          <p>
            Paid plans are billed monthly or annually in advance through Stripe
            and renew automatically until cancelled. You can cancel anytime from
            your <a href="/dashboard" className="text-violet-600 hover:underline">dashboard</a>;
            you keep access until the end of the current billing period. Where a
            free trial is offered, you won&apos;t be charged until it ends. AI
            credits reset each billing period and don&apos;t roll over.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Availability</h2>
          <p>
            We aim for high availability but don&apos;t guarantee the service will
            be uninterrupted or error-free. Tools are provided &quot;as is&quot;
            without warranty of any kind.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Termination</h2>
          <p>
            We may suspend or terminate accounts that violate these terms. You
            may stop using the service and delete your account at any time.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Contact</h2>
          <p>
            Questions about these terms? Reach us at{" "}
            <a href="mailto:legal@toolforge.io" className="text-violet-600 hover:underline">
              legal@toolforge.io
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
