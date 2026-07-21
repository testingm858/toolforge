import type { Metadata } from "next";
import { Mail, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the ToolForge team.",
};

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Contact us</h1>
      <p className="text-gray-500 mb-10">
        Bug report, billing question, tool request — pick the right inbox below
        and we&apos;ll get back to you.
      </p>

      <div className="space-y-4">
        <a
          href="mailto:support@toolforge.io"
          className="flex items-start gap-4 bg-white border border-gray-100 rounded-2xl p-6 hover:border-violet-300 hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">General support</h2>
            <p className="text-sm text-gray-500 mt-0.5">Bugs, feature requests, or a tool you wish existed.</p>
            <p className="text-sm text-violet-600 font-medium mt-2">support@toolforge.io</p>
          </div>
        </a>

        <a
          href="mailto:billing@toolforge.io"
          className="flex items-start gap-4 bg-white border border-gray-100 rounded-2xl p-6 hover:border-violet-300 hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Billing</h2>
            <p className="text-sm text-gray-500 mt-0.5">Subscription, invoices, or refund questions.</p>
            <p className="text-sm text-violet-600 font-medium mt-2">billing@toolforge.io</p>
          </div>
        </a>
      </div>

      <p className="text-xs text-gray-400 mt-8">
        Pro and Enterprise subscribers can also manage billing directly from the{" "}
        <a href="/dashboard" className="text-violet-600 hover:underline">dashboard</a>.
      </p>
    </div>
  );
}
