"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, RotateCw, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

interface CapturedRequest {
  method: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body: string;
  receivedAt: string;
}

const POLL_INTERVAL_MS = 3000;
const SESSION_MINUTES = 30;

export default function WebhookTesterClient() {
  const [token, setToken] = useState<string | null>(null);
  const [requests, setRequests] = useState<CapturedRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expired, setExpired] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const poll = useCallback(async (t: string) => {
    try {
      const res = await fetch(`/api/webhook-session/${t}`);
      if (res.status === 404) {
        setExpired(true);
        stopPolling();
        return;
      }
      const data = await res.json();
      setRequests(data.requests ?? []);
    } catch {
      // transient network error — next poll will retry
    }
  }, [stopPolling]);

  useEffect(() => stopPolling, [stopPolling]);

  async function generateUrl() {
    setLoading(true);
    setError(null);
    setExpired(false);
    stopPolling();

    try {
      const res = await fetch("/api/tools/webhook-tester", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "premium_required" || data.error === "rate_limited") {
          setError(`${data.error === "premium_required" ? "🔒" : "⏱️"} ${data.message}`);
        } else {
          setError(data.error || data.result?.error || "Something went wrong");
        }
        return;
      }

      const newToken = data.result.token as string;
      setToken(newToken);
      setRequests([]);
      pollRef.current = setInterval(() => poll(newToken), POLL_INTERVAL_MS);
      poll(newToken);
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  async function copyUrl() {
    if (!token) return;
    await navigator.clipboard.writeText(catchUrl(token));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function catchUrl(t: string) {
    return `${window.location.origin}/api/webhook-catch/${t}`;
  }

  return (
    <div className="space-y-4">
      {!token && (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <Radio className="w-8 h-8 text-violet-400 mx-auto mb-4" />
          <p className="text-gray-600 text-sm mb-6">
            Generate a temporary URL, then point any webhook (Stripe, GitHub,
            a form, your own code) at it. Every request that hits it shows up
            below in real time. Sessions last {SESSION_MINUTES} minutes.
          </p>
          <button
            onClick={generateUrl}
            disabled={loading}
            className="bg-violet-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-violet-700 transition-colors disabled:opacity-60"
          >
            {loading ? "Generating..." : "Generate test URL"}
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
          {error}
          {error.includes("Pro") && (
            <a href="/pricing" className="block mt-2 text-violet-600 font-semibold hover:underline">
              Upgrade to Pro →
            </a>
          )}
        </div>
      )}

      {token && (
        <>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Your webhook URL</span>
              {!expired && (
                <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Listening
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 overflow-x-auto whitespace-nowrap">
                {catchUrl(token)}
              </code>
              <button
                onClick={copyUrl}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 bg-white border border-gray-200 px-3 py-2 rounded-lg transition-colors shrink-0"
              >
                <Copy className="w-3 h-3" />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            {expired && (
              <p className="text-xs text-amber-600 mt-3">
                This session expired after {SESSION_MINUTES} minutes.{" "}
                <button onClick={generateUrl} className="underline font-medium">Generate a new one</button>.
              </p>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
              <span className="text-sm font-medium text-gray-600">
                Captured requests {requests.length > 0 && `(${requests.length})`}
              </span>
              <button onClick={generateUrl} className="text-gray-400 hover:text-gray-600 transition-colors" title="New URL">
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            {requests.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">
                Waiting for a request — send one to the URL above.
              </p>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                {requests.map((r, i) => (
                  <details key={i} className="p-4" open={i === 0}>
                    <summary className="flex items-center gap-3 cursor-pointer text-sm">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-bold",
                        r.method === "GET" ? "bg-blue-100 text-blue-700" :
                        r.method === "POST" ? "bg-green-100 text-green-700" :
                        r.method === "DELETE" ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-700"
                      )}>
                        {r.method}
                      </span>
                      <span className="text-gray-500 text-xs">{new Date(r.receivedAt).toLocaleTimeString()}</span>
                    </summary>
                    <div className="mt-3 space-y-3 text-xs">
                      {Object.keys(r.query).length > 0 && (
                        <div>
                          <p className="text-gray-400 font-medium mb-1">Query</p>
                          <pre className="bg-gray-50 rounded-lg p-2 overflow-x-auto">{JSON.stringify(r.query, null, 2)}</pre>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-400 font-medium mb-1">Headers</p>
                        <pre className="bg-gray-50 rounded-lg p-2 overflow-x-auto max-h-40 overflow-y-auto">{JSON.stringify(r.headers, null, 2)}</pre>
                      </div>
                      {r.body && (
                        <div>
                          <p className="text-gray-400 font-medium mb-1">Body</p>
                          <pre className="bg-gray-50 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap max-h-60 overflow-y-auto">{r.body}</pre>
                        </div>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
