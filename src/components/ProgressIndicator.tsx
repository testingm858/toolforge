"use client";

import { useCallback, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Drives a progress value that creeps toward `ceiling` on its own (for phases
// where we have no real byte-level signal, e.g. server-side processing time),
// while still letting real progress events (file upload bytes) overtake it —
// callers combine the two with Math.max via setProgress.
export function useProgressSimulation() {
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback((from = 3, ceiling = 90) => {
    stop();
    setProgress((p) => Math.max(p, from));
    timerRef.current = setInterval(() => {
      setProgress((p) => (p >= ceiling ? p : p + Math.max(0.4, (ceiling - p) * 0.06)));
    }, 120);
  }, [stop]);

  const finish = useCallback(() => {
    stop();
    setProgress(100);
  }, [stop]);

  const reset = useCallback(() => {
    stop();
    setProgress(0);
  }, [stop]);

  return { progress, setProgress, start, finish, reset, stop };
}

function CheckAnimation() {
  return (
    <svg viewBox="0 0 52 52" className="w-9 h-9">
      <circle cx="26" cy="26" r="24" fill="none" stroke="#16a34a" strokeWidth="3" className="check-circle" />
      <path fill="none" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" d="M14 27l7 7 17-17" className="check-mark" />
    </svg>
  );
}

export function ProgressRing({
  progress,
  size = 108,
  strokeWidth = 7,
  done = false,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  done?: boolean;
}) {
  const gradId = useId();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clamped = Math.min(100, Math.max(0, progress));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" className="text-gray-100" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-200 ease-out"
        />
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {done ? <CheckAnimation /> : <span className="text-lg font-bold text-gray-900 tabular-nums">{Math.round(clamped)}%</span>}
      </div>
    </div>
  );
}

export function ProgressBar({ progress, className }: { progress: number; className?: string }) {
  const clamped = Math.min(100, Math.max(0, progress));
  return (
    <div className={cn("relative w-full h-2 bg-gray-100 rounded-full overflow-hidden", className)}>
      <div
        className="relative h-full bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full overflow-hidden transition-[width] duration-200 ease-out"
        style={{ width: `${clamped}%` }}
      >
        {clamped < 100 && (
          <span className="progress-shimmer absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        )}
      </div>
    </div>
  );
}

export function ProcessingPanel({
  progress,
  phaseLabel,
  success,
}: {
  progress: number;
  phaseLabel: string;
  success: boolean;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center gap-4">
      <ProgressRing progress={progress} done={success} />
      <div className="w-full max-w-xs">
        <ProgressBar progress={progress} />
      </div>
      <p className={cn("text-sm font-medium transition-colors", success ? "text-green-600" : "text-gray-500")}>
        {success ? "Done!" : phaseLabel}
      </p>
    </div>
  );
}

function formatBytes(n: number): string {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${n} B`;
}

// Graphical before/after size comparison shown after any file-tool
// operation completes — two proportional bars plus a %-change badge.
export function SizeComparison({ originalBytes, newBytes }: { originalBytes: number; newBytes: number }) {
  const max = Math.max(originalBytes, newBytes, 1);
  const originalPct = (originalBytes / max) * 100;
  const newPct = (newBytes / max) * 100;
  const delta = originalBytes > 0 ? ((newBytes - originalBytes) / originalBytes) * 100 : 0;
  const smaller = newBytes < originalBytes;
  const larger = newBytes > originalBytes;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-600">Size comparison</span>
        <span
          className={cn(
            "text-xs font-semibold px-2 py-1 rounded-full tabular-nums",
            smaller ? "bg-green-50 text-green-700" : larger ? "bg-amber-50 text-amber-700" : "bg-gray-50 text-gray-500"
          )}
        >
          {delta === 0 ? "No change" : `${delta > 0 ? "+" : ""}${delta.toFixed(0)}%`}
        </span>
      </div>
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Original</span><span className="tabular-nums">{formatBytes(originalBytes)}</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gray-300 rounded-full" style={{ width: `${originalPct}%` }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Result</span><span className="tabular-nums">{formatBytes(newBytes)}</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-[width] duration-500 ease-out", smaller ? "bg-gradient-to-r from-emerald-500 to-green-500" : "bg-gradient-to-r from-violet-600 to-fuchsia-600")}
              style={{ width: `${newPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
