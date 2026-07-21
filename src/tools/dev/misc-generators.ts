// Small pure generators/utilities — lorem ipsum, diff, cron explain,
// .gitignore templates, .htaccess rules. All static logic, no external deps.

const LOREM_WORDS = (
  "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod " +
  "tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam " +
  "quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo " +
  "consequat duis aute irure in reprehenderit voluptate velit esse cillum " +
  "eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident " +
  "sunt culpa qui officia deserunt mollit anim id est laborum"
).split(" ");

function loremWords(n: number): string {
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(LOREM_WORDS[i % LOREM_WORDS.length]);
  out[0] = out[0][0].toUpperCase() + out[0].slice(1);
  return out.join(" ") + ".";
}

const LOREM_MAX: Record<"words" | "sentences" | "paragraphs", number> = {
  words: 10000, sentences: 1000, paragraphs: 200,
};

export function generateLoremIpsum(count: number, unit: "words" | "sentences" | "paragraphs" = "paragraphs"): string {
  if (!Number.isFinite(count) || count <= 0) throw new Error("count must be a positive number");
  // Confirmed count:5000000 words completed (no hang) but produced a
  // multi-tens-of-MB response with no legitimate use case — cap at
  // something far beyond any real placeholder-text need.
  const max = LOREM_MAX[unit];
  if (count > max) throw new Error(`count must be ${max} or fewer for ${unit}`);
  if (unit === "words") return loremWords(count);
  if (unit === "sentences") {
    return Array.from({ length: count }, () => loremWords(8 + Math.floor(Math.random() * 8))).join(" ");
  }
  return Array.from({ length: count }, () => {
    const sentences = 3 + Math.floor(Math.random() * 3);
    return Array.from({ length: sentences }, () => loremWords(8 + Math.floor(Math.random() * 8))).join(" ");
  }).join("\n\n");
}

export interface DiffLine { type: "same" | "added" | "removed"; text: string }

export function diffLines(a: string, b: string): DiffLine[] {
  const aLines = a.split("\n");
  const bLines = b.split("\n");
  const m = aLines.length, n = bLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = aLines[i] === bLines[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const result: DiffLine[] = [];
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (aLines[i] === bLines[j]) { result.push({ type: "same", text: aLines[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { result.push({ type: "removed", text: aLines[i] }); i++; }
    else { result.push({ type: "added", text: bLines[j] }); j++; }
  }
  while (i < m) { result.push({ type: "removed", text: aLines[i] }); i++; }
  while (j < n) { result.push({ type: "added", text: bLines[j] }); j++; }
  return result;
}

const CRON_FIELDS = ["minute", "hour", "day of month", "month", "day of week"];

export function explainCron(expression: string): { expression: string; explanation: string; fields: Record<string, string> } {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) throw new Error("Cron expression must have 5 fields: minute hour day-of-month month day-of-week");
  const fields: Record<string, string> = {};
  CRON_FIELDS.forEach((name, i) => { fields[name] = parts[i]; });

  const describe = (value: string, unit: string) => {
    if (value === "*") return `every ${unit}`;
    if (value.startsWith("*/")) return `every ${value.slice(2)} ${unit}(s)`;
    if (value.includes(",")) return `at ${unit}(s) ${value}`;
    if (value.includes("-")) return `every ${unit} from ${value.replace("-", " to ")}`;
    return `at ${unit} ${value}`;
  };

  const explanation = [
    describe(parts[0], "minute"),
    describe(parts[1], "hour"),
    parts[2] === "*" ? null : describe(parts[2], "day of month"),
    parts[3] === "*" ? null : describe(parts[3], "month"),
    parts[4] === "*" ? null : describe(parts[4], "day of week"),
  ].filter(Boolean).join(", ");

  return { expression, explanation: explanation || "every minute", fields };
}

const GITIGNORE_TEMPLATES: Record<string, string[]> = {
  node: ["node_modules/", "npm-debug.log*", "yarn-debug.log*", "yarn-error.log*", ".pnpm-debug.log*", "dist/", "build/", ".env", ".env.local"],
  python: ["__pycache__/", "*.py[cod]", "*.egg-info/", ".venv/", "venv/", "dist/", "build/", ".pytest_cache/", ".env"],
  java: ["*.class", "*.jar", "*.war", "target/", ".gradle/", "build/"],
  go: ["*.exe", "*.dll", "*.so", "*.dylib", "*.test", "vendor/"],
  rust: ["/target/", "**/*.rs.bk", "Cargo.lock"],
  macos: [".DS_Store", ".AppleDouble", ".LSOverride"],
  windows: ["Thumbs.db", "ehthumbs.db", "Desktop.ini", "$RECYCLE.BIN/"],
  jetbrains: [".idea/", "*.iml"],
  vscode: [".vscode/*", "!.vscode/extensions.json"],
};

export function generateGitignore(stacks: string[]): string {
  if (!stacks || stacks.length === 0) throw new Error("Provide at least one stack, e.g. [\"node\", \"macos\"]");
  const sections: string[] = [];
  for (const stack of stacks) {
    const key = stack.trim().toLowerCase();
    const lines = GITIGNORE_TEMPLATES[key];
    if (!lines) throw new Error(`Unknown stack "${stack}". Supported: ${Object.keys(GITIGNORE_TEMPLATES).join(", ")}`);
    sections.push(`# ${stack}\n${lines.join("\n")}`);
  }
  return sections.join("\n\n");
}

export function generateHtaccess(opts: {
  forceHttps?: boolean;
  wwwRedirect?: "add" | "remove";
  customRedirects?: { from: string; to: string }[];
  basicAuth?: { realm: string; userFile: string };
  errorPages?: Record<string, string>;
}): string {
  const lines: string[] = [];
  if (opts.forceHttps) {
    lines.push(
      "RewriteEngine On",
      "RewriteCond %{HTTPS} off",
      "RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]"
    );
  }
  if (opts.wwwRedirect === "add") {
    lines.push(
      "RewriteEngine On",
      "RewriteCond %{HTTP_HOST} !^www\\.",
      "RewriteRule ^(.*)$ https://www.%{HTTP_HOST}%{REQUEST_URI} [L,R=301]"
    );
  } else if (opts.wwwRedirect === "remove") {
    lines.push(
      "RewriteEngine On",
      "RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]",
      "RewriteRule ^(.*)$ https://%1%{REQUEST_URI} [L,R=301]"
    );
  }
  for (const r of opts.customRedirects ?? []) {
    lines.push(`Redirect 301 ${r.from} ${r.to}`);
  }
  if (opts.basicAuth) {
    lines.push(
      "AuthType Basic",
      `AuthName "${opts.basicAuth.realm}"`,
      `AuthUserFile ${opts.basicAuth.userFile}`,
      "Require valid-user"
    );
  }
  for (const [code, path] of Object.entries(opts.errorPages ?? {})) {
    lines.push(`ErrorDocument ${code} ${path}`);
  }
  if (lines.length === 0) throw new Error("No options provided — set at least one of forceHttps, wwwRedirect, customRedirects, basicAuth, errorPages");
  return lines.join("\n");
}
