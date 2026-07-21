import type { Metadata } from "next";
import Link from "next/link";
import { ALL_TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
  title: "API Docs",
  description: "The REST endpoint that powers every ToolForge tool.",
};

const CODE_BLOCK_CLASS =
  "bg-gray-900 text-gray-100 text-xs rounded-xl p-4 overflow-x-auto leading-relaxed";

export default function ApiDocsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">API</h1>
      <p className="text-gray-500 mb-10">
        Every tool on ToolForge — free and Pro — runs through one endpoint.
        This is the same API the web UI calls.
      </p>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-800 mb-10">
        <strong>Note:</strong> requests are authenticated with your browser
        session cookie today, the same as being signed in on the site.
        Dedicated API keys for headless/server-to-server access (the
        &quot;API access + SDKs&quot; Enterprise feature) are on the roadmap
        and not available yet — for now, calls from outside the browser will
        be treated as anonymous and subject to the anonymous rate limit.
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Endpoint</h2>
        <pre className={CODE_BLOCK_CLASS}>POST /api/tools/:toolId</pre>
        <p className="text-sm text-gray-500 mt-3">
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">toolId</code>{" "}
          is any tool slug, e.g. <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">json-formatter</code> or{" "}
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">bmi-calculator</code>. See the{" "}
          <Link href="/tools" className="text-violet-600 hover:underline">full tool list</Link> ({ALL_TOOLS.length} tools) for every slug.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Request body</h2>
        <p className="text-sm text-gray-500 mb-3">
          Most tools take a single <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">input</code> string.
          Tools with multiple named parameters (calculators, SEO generators) take
          a JSON object in that same field — see each tool&apos;s page for its
          exact shape.
        </p>
        <pre className={CODE_BLOCK_CLASS}>{`// simple text tool
{ "input": "hello world" }

// structured tool (e.g. bmi-calculator)
{ "input": "{\\"weight\\": 70, \\"height\\": 175, \\"unit\\": \\"metric\\"}" }`}</pre>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Response</h2>
        <pre className={CODE_BLOCK_CLASS}>{`200 OK
{ "result": { ... }, "latencyMs": 42 }`}</pre>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Error responses</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100">
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">error</th>
                <th className="py-2 font-medium">Meaning</th>
              </tr>
            </thead>
            <tbody className="text-gray-600">
              <tr className="border-b border-gray-50">
                <td className="py-2 pr-4">403</td>
                <td className="py-2 pr-4"><code className="text-xs">premium_required</code></td>
                <td className="py-2">Tool needs a Pro/Enterprise plan.</td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="py-2 pr-4">429</td>
                <td className="py-2 pr-4"><code className="text-xs">rate_limited</code></td>
                <td className="py-2">Daily usage limit reached for your plan.</td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="py-2 pr-4">402</td>
                <td className="py-2 pr-4"><code className="text-xs">insufficient_credits</code></td>
                <td className="py-2">Not enough AI credits left this period.</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">500</td>
                <td className="py-2 pr-4">—</td>
                <td className="py-2">Bad or malformed input for that tool.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Example</h2>
        <pre className={CODE_BLOCK_CLASS}>{`curl -X POST https://toolforge.io/api/tools/hash-generator \\
  -H "Content-Type: application/json" \\
  -d '{"input": "hello world"}'`}</pre>
      </section>
    </div>
  );
}
