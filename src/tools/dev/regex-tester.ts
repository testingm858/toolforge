// Regex Tester — one-shot match against a test string, no deps.
//
// The pattern AND the test string are both fully user-controlled, and
// regex matching is synchronous, CPU-bound work on Node's single request
// thread — a classic ReDoS setup. Confirmed: a pattern like "(a+)+$"
// against ~30 "a" characters causes catastrophic backtracking that didn't
// complete within 8 seconds (would run far longer on a slightly bigger
// input), which would hang the entire server process, not just this
// request, since JS can't preempt synchronous code on the same thread.
// vm's `timeout` option is the one thing that CAN interrupt a runaway
// regex mid-match (V8's regex engine checks for the interrupt V8's
// TerminateExecution raises); confirmed it reliably aborts the pattern
// above after ~1s instead of hanging.

import vm from "node:vm";

const ALLOWED_FLAGS = /^[gimsuy]*$/;
const MATCH_TIMEOUT_MS = 1000;

export function testRegex(pattern: string, flags: string, testString: string): {
  isValid: boolean;
  matchCount: number;
  matches: { match: string; index: number; groups: (string | undefined)[] }[];
  error?: string;
} {
  if (!pattern) throw new Error("pattern is required");
  if (flags && !ALLOWED_FLAGS.test(flags)) throw new Error("flags may only contain g, i, m, s, u, y");

  const effectiveFlags = flags.includes("g") ? flags : flags + "g";
  try {
    new RegExp(pattern, effectiveFlags); // validate the pattern compiles at all
  } catch {
    return { isValid: false, matchCount: 0, matches: [] };
  }

  const context = vm.createContext({ pattern, flags: effectiveFlags, testString, matches: [] as { match: string; index: number; groups: (string | undefined)[] }[] });
  const code = `(function() {
    const re = new RegExp(pattern, flags);
    let m;
    let iterations = 0;
    while ((m = re.exec(testString)) !== null && iterations < 1000) {
      matches.push({ match: m[0], index: m.index, groups: m.slice(1) });
      if (m[0] === "") re.lastIndex++;
      iterations++;
    }
  })();`;

  try {
    vm.runInContext(code, context, { timeout: MATCH_TIMEOUT_MS });
  } catch {
    return {
      isValid: false,
      matchCount: 0,
      matches: [],
      error: "This pattern took too long to match against the test string — it likely causes catastrophic backtracking (e.g. nested quantifiers like (a+)+). Try simplifying it.",
    };
  }

  return { isValid: true, matchCount: context.matches.length, matches: context.matches };
}
