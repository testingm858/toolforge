// Declarative form fields for tools that currently take a JSON object typed
// into a plain textarea (calculators, CSS/SEO generators, etc). Where a
// tool is listed here, ToolInterface renders real inputs instead of asking
// a general consumer to hand-write JSON, then assembles the same JSON
// string under the hood before POSTing — the API contract is unchanged.
//
// Tools with genuinely variable-shape data (arrays of objects: sitemap
// URLs, hreflang page lists, invoice line items, resume sections, JWT
// payloads, schema.org data) are intentionally left off this list and keep
// the JSON textarea — there's no simple-form equivalent for "N objects with
// user-defined keys" that isn't just a worse code editor.

export type ToolFieldType = "number" | "text" | "textarea" | "select" | "checkbox" | "date" | "color" | "multiselect";

export interface ToolFieldOption {
  label: string;
  value: string | number;
}

export interface ToolField {
  name: string;
  label: string;
  type: ToolFieldType;
  defaultValue?: string | number | boolean;
  options?: ToolFieldOption[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  showIf?: { field: string; equals: string | number }; // conditional rendering
}

export const TOOL_FIELDS: Record<string, ToolField[]> = {
  "bmi-calculator": [
    { name: "weight", label: "Weight", type: "number", required: true, min: 1 },
    { name: "height", label: "Height", type: "number", required: true, min: 1 },
    { name: "unit", label: "Unit", type: "select", defaultValue: "metric", options: [
      { label: "Metric (kg / cm)", value: "metric" }, { label: "Imperial (lb / in)", value: "imperial" },
    ] },
  ],
  "loan-calculator": [
    { name: "principal", label: "Loan amount", type: "number", required: true, min: 1 },
    { name: "rate", label: "Annual interest rate (%)", type: "number", required: true, min: 0, step: 0.1 },
    { name: "months", label: "Term (months)", type: "number", required: true, min: 1 },
  ],
  "mortgage-calculator": [
    { name: "homePrice", label: "Home price", type: "number", required: true, min: 1 },
    { name: "downPaymentPct", label: "Down payment (%)", type: "number", defaultValue: 20, min: 0, max: 99 },
    { name: "rate", label: "Annual interest rate (%)", type: "number", required: true, min: 0, step: 0.1 },
    { name: "years", label: "Term (years)", type: "number", defaultValue: 30, min: 1 },
  ],
  "age-calculator": [
    { name: "birthDate", label: "Date of birth", type: "date", required: true },
    { name: "asOf", label: "As of date (optional)", type: "date" },
  ],
  "gst-calculator": [
    { name: "amount", label: "Amount", type: "number", required: true, min: 0 },
    { name: "rate", label: "Tax rate (%)", type: "number", required: true, min: 0, step: 0.1 },
    { name: "mode", label: "Amount is", type: "select", defaultValue: "exclusive", options: [
      { label: "Exclusive of tax", value: "exclusive" }, { label: "Inclusive of tax", value: "inclusive" },
    ] },
  ],
  "profit-calculator": [
    { name: "revenue", label: "Revenue", type: "number", required: true, min: 0 },
    { name: "cost", label: "Cost", type: "number", required: true, min: 0 },
  ],
  "percentage-calculator": [
    { name: "op", label: "Calculation", type: "select", defaultValue: "of", options: [
      { label: "A% of B", value: "of" }, { label: "% change from A to B", value: "change" }, { label: "A is what % of B", value: "whatPercent" },
    ] },
    { name: "a", label: "A", type: "number", required: true },
    { name: "b", label: "B", type: "number", required: true },
  ],
  "timezone-calculator": [
    { name: "dateTimeIso", label: "Date & time", type: "text", required: true, placeholder: "2026-07-15T14:00:00Z" },
    { name: "fromZone", label: "From timezone", type: "text", required: true, placeholder: "UTC" },
    { name: "toZone", label: "To timezone", type: "text", required: true, placeholder: "America/New_York" },
  ],
  "pregnancy-calculator": [
    { name: "lastPeriodDate", label: "First day of last period", type: "date", required: true },
  ],
  "calorie-calculator": [
    { name: "weightKg", label: "Weight (kg)", type: "number", required: true, min: 1 },
    { name: "heightCm", label: "Height (cm)", type: "number", required: true, min: 1 },
    { name: "age", label: "Age", type: "number", required: true, min: 1 },
    { name: "sex", label: "Sex", type: "select", defaultValue: "male", options: [{ label: "Male", value: "male" }, { label: "Female", value: "female" }] },
    { name: "activityLevel", label: "Activity level", type: "select", defaultValue: "moderate", options: [
      { label: "Sedentary", value: "sedentary" }, { label: "Light", value: "light" }, { label: "Moderate", value: "moderate" },
      { label: "Active", value: "active" }, { label: "Very active", value: "veryActive" },
    ] },
  ],
  "bmr-calculator": [
    { name: "weightKg", label: "Weight (kg)", type: "number", required: true, min: 1 },
    { name: "heightCm", label: "Height (cm)", type: "number", required: true, min: 1 },
    { name: "age", label: "Age", type: "number", required: true, min: 1 },
    { name: "sex", label: "Sex", type: "select", defaultValue: "male", options: [{ label: "Male", value: "male" }, { label: "Female", value: "female" }] },
  ],
  "fuel-calculator": [
    { name: "distanceKm", label: "Distance (km)", type: "number", required: true, min: 0 },
    { name: "fuelEfficiencyKmPerL", label: "Efficiency (km per liter)", type: "number", required: true, min: 0.1 },
    { name: "pricePerLiter", label: "Price per liter", type: "number", required: true, min: 0 },
  ],
  "roi-calculator": [
    { name: "gain", label: "Total gain", type: "number", required: true, min: 0 },
    { name: "cost", label: "Total cost", type: "number", required: true, min: 0 },
  ],
  "meeting-cost": [
    { name: "attendees", label: "Attendees", type: "number", required: true, min: 1 },
    { name: "avgHourlySalary", label: "Average hourly salary", type: "number", required: true, min: 0 },
    { name: "durationMinutes", label: "Duration (minutes)", type: "number", required: true, min: 1 },
  ],
  // The 30 currencies the European Central Bank publishes daily reference
  // rates for (see currency-converter.ts) — the full set our free, no-key
  // data source (frankfurter.dev) supports.
  "currency-converter": [
    { name: "amount", label: "Amount", type: "number", required: true, min: 0, defaultValue: 1 },
    { name: "from", label: "From", type: "select", defaultValue: "USD", options: [
      { label: "AUD — Australian Dollar", value: "AUD" }, { label: "BRL — Brazilian Real", value: "BRL" },
      { label: "CAD — Canadian Dollar", value: "CAD" }, { label: "CHF — Swiss Franc", value: "CHF" },
      { label: "CNY — Chinese Yuan", value: "CNY" }, { label: "CZK — Czech Koruna", value: "CZK" },
      { label: "DKK — Danish Krone", value: "DKK" }, { label: "EUR — Euro", value: "EUR" },
      { label: "GBP — British Pound", value: "GBP" }, { label: "HKD — Hong Kong Dollar", value: "HKD" },
      { label: "HUF — Hungarian Forint", value: "HUF" }, { label: "IDR — Indonesian Rupiah", value: "IDR" },
      { label: "ILS — Israeli New Shekel", value: "ILS" }, { label: "INR — Indian Rupee", value: "INR" },
      { label: "ISK — Icelandic Króna", value: "ISK" }, { label: "JPY — Japanese Yen", value: "JPY" },
      { label: "KRW — South Korean Won", value: "KRW" }, { label: "MXN — Mexican Peso", value: "MXN" },
      { label: "MYR — Malaysian Ringgit", value: "MYR" }, { label: "NOK — Norwegian Krone", value: "NOK" },
      { label: "NZD — New Zealand Dollar", value: "NZD" }, { label: "PHP — Philippine Peso", value: "PHP" },
      { label: "PLN — Polish Złoty", value: "PLN" }, { label: "RON — Romanian Leu", value: "RON" },
      { label: "SEK — Swedish Krona", value: "SEK" }, { label: "SGD — Singapore Dollar", value: "SGD" },
      { label: "THB — Thai Baht", value: "THB" }, { label: "TRY — Turkish Lira", value: "TRY" },
      { label: "USD — United States Dollar", value: "USD" }, { label: "ZAR — South African Rand", value: "ZAR" },
    ] },
    { name: "to", label: "To", type: "select", defaultValue: "EUR", options: [
      { label: "AUD — Australian Dollar", value: "AUD" }, { label: "BRL — Brazilian Real", value: "BRL" },
      { label: "CAD — Canadian Dollar", value: "CAD" }, { label: "CHF — Swiss Franc", value: "CHF" },
      { label: "CNY — Chinese Yuan", value: "CNY" }, { label: "CZK — Czech Koruna", value: "CZK" },
      { label: "DKK — Danish Krone", value: "DKK" }, { label: "EUR — Euro", value: "EUR" },
      { label: "GBP — British Pound", value: "GBP" }, { label: "HKD — Hong Kong Dollar", value: "HKD" },
      { label: "HUF — Hungarian Forint", value: "HUF" }, { label: "IDR — Indonesian Rupiah", value: "IDR" },
      { label: "ILS — Israeli New Shekel", value: "ILS" }, { label: "INR — Indian Rupee", value: "INR" },
      { label: "ISK — Icelandic Króna", value: "ISK" }, { label: "JPY — Japanese Yen", value: "JPY" },
      { label: "KRW — South Korean Won", value: "KRW" }, { label: "MXN — Mexican Peso", value: "MXN" },
      { label: "MYR — Malaysian Ringgit", value: "MYR" }, { label: "NOK — Norwegian Krone", value: "NOK" },
      { label: "NZD — New Zealand Dollar", value: "NZD" }, { label: "PHP — Philippine Peso", value: "PHP" },
      { label: "PLN — Polish Złoty", value: "PLN" }, { label: "RON — Romanian Leu", value: "RON" },
      { label: "SEK — Swedish Krona", value: "SEK" }, { label: "SGD — Singapore Dollar", value: "SGD" },
      { label: "THB — Thai Baht", value: "THB" }, { label: "TRY — Turkish Lira", value: "TRY" },
      { label: "USD — United States Dollar", value: "USD" }, { label: "ZAR — South African Rand", value: "ZAR" },
    ] },
  ],
  "ip-lookup": [
    { name: "ip", label: "IP address (optional)", type: "text", placeholder: "Leave blank to look up your own IP", helpText: "Enter any IPv4 or IPv6 address, or leave blank for your own" },
  ],
  "rgb-to-hex": [
    { name: "r", label: "R", type: "number", required: true, min: 0, max: 255, defaultValue: 0 },
    { name: "g", label: "G", type: "number", required: true, min: 0, max: 255, defaultValue: 0 },
    { name: "b", label: "B", type: "number", required: true, min: 0, max: 255, defaultValue: 0 },
  ],
  "gradient-generator": [
    { name: "color1", label: "Color 1", type: "color", defaultValue: "#7c3aed" },
    { name: "color2", label: "Color 2", type: "color", defaultValue: "#ec4899" },
    { name: "angle", label: "Angle (degrees)", type: "number", defaultValue: 135, min: 0, max: 360 },
    { name: "type", label: "Type", type: "select", defaultValue: "linear", options: [{ label: "Linear", value: "linear" }, { label: "Radial", value: "radial" }] },
  ],
  "box-shadow": [
    { name: "offsetX", label: "Offset X (px)", type: "number", defaultValue: 0 },
    { name: "offsetY", label: "Offset Y (px)", type: "number", defaultValue: 4 },
    { name: "blur", label: "Blur (px)", type: "number", defaultValue: 12, min: 0 },
    { name: "spread", label: "Spread (px)", type: "number", defaultValue: 0 },
    { name: "color", label: "Color", type: "color", defaultValue: "#000000" },
  ],
  "button-generator": [
    { name: "bg", label: "Background", type: "color", defaultValue: "#7c3aed" },
    { name: "color", label: "Text color", type: "color", defaultValue: "#ffffff" },
    { name: "hoverBg", label: "Hover background", type: "color", defaultValue: "#6d28d9" },
    { name: "paddingY", label: "Vertical padding (px)", type: "number", defaultValue: 12, min: 0 },
    { name: "paddingX", label: "Horizontal padding (px)", type: "number", defaultValue: 24, min: 0 },
    { name: "radius", label: "Corner radius (px)", type: "number", defaultValue: 8, min: 0 },
    { name: "fontSize", label: "Font size (px)", type: "number", defaultValue: 16, min: 1 },
  ],
  "animation-generator": [
    { name: "name", label: "Animation name", type: "text", defaultValue: "fadeIn" },
    { name: "type", label: "Effect", type: "select", defaultValue: "fade", options: [
      { label: "Fade", value: "fade" }, { label: "Slide up", value: "slide-up" }, { label: "Slide in", value: "slide-in" },
      { label: "Bounce", value: "bounce" }, { label: "Spin", value: "spin" }, { label: "Pulse", value: "pulse" },
    ] },
    { name: "durationSeconds", label: "Duration (seconds)", type: "number", defaultValue: 0.6, min: 0.1, step: 0.1 },
    { name: "easing", label: "Easing", type: "select", defaultValue: "ease", options: [
      { label: "ease", value: "ease" }, { label: "linear", value: "linear" }, { label: "ease-in", value: "ease-in" },
      { label: "ease-out", value: "ease-out" }, { label: "ease-in-out", value: "ease-in-out" },
    ] },
  ],
  "grid-generator": [
    { name: "columns", label: "Columns", type: "number", defaultValue: 3, min: 1 },
    { name: "rows", label: "Rows", type: "number", defaultValue: 2, min: 1 },
    { name: "gap", label: "Gap (px)", type: "number", defaultValue: 16, min: 0 },
  ],
  "flexbox-generator": [
    { name: "direction", label: "Direction", type: "select", defaultValue: "row", options: [
      { label: "Row", value: "row" }, { label: "Row reverse", value: "row-reverse" }, { label: "Column", value: "column" }, { label: "Column reverse", value: "column-reverse" },
    ] },
    { name: "justify", label: "Justify content", type: "select", defaultValue: "flex-start", options: [
      { label: "flex-start", value: "flex-start" }, { label: "center", value: "center" }, { label: "flex-end", value: "flex-end" },
      { label: "space-between", value: "space-between" }, { label: "space-around", value: "space-around" }, { label: "space-evenly", value: "space-evenly" },
    ] },
    { name: "align", label: "Align items", type: "select", defaultValue: "stretch", options: [
      { label: "stretch", value: "stretch" }, { label: "flex-start", value: "flex-start" }, { label: "center", value: "center" }, { label: "flex-end", value: "flex-end" },
    ] },
    { name: "gap", label: "Gap (px)", type: "number", defaultValue: 16, min: 0 },
  ],
  "svg-blob-generator": [
    { name: "size", label: "Size (px)", type: "number", defaultValue: 200, min: 20 },
    { name: "complexity", label: "Complexity", type: "number", defaultValue: 6, min: 3, max: 12 },
    { name: "color", label: "Color", type: "color", defaultValue: "#7c3aed" },
  ],
  "qr-generator": [
    { name: "text", label: "Text or URL", type: "text", required: true, placeholder: "https://example.com" },
    { name: "size", label: "Size (px)", type: "number", defaultValue: 300, min: 64, max: 2000 },
    { name: "darkColor", label: "Foreground color", type: "color", defaultValue: "#000000" },
    { name: "lightColor", label: "Background color", type: "color", defaultValue: "#ffffff" },
  ],
  "barcode-generator": [
    { name: "text", label: "Text / number", type: "text", required: true, placeholder: "012345678905" },
    { name: "type", label: "Barcode type", type: "select", defaultValue: "code128", options: [
      { label: "Code 128", value: "code128" }, { label: "EAN-13", value: "ean13" }, { label: "EAN-8", value: "ean8" },
      { label: "UPC-A", value: "upca" }, { label: "Code 39", value: "code39" }, { label: "ITF-14", value: "itf14" },
    ] },
  ],
  "meta-tag-generator": [
    { name: "title", label: "Page title", type: "text", required: true },
    { name: "description", label: "Description", type: "textarea" },
    { name: "keywords", label: "Keywords", type: "text", placeholder: "comma-separated" },
    { name: "author", label: "Author", type: "text" },
    { name: "canonical", label: "Canonical URL", type: "text" },
    { name: "noindex", label: "Add noindex tag", type: "checkbox" },
  ],
  "og-generator": [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "description", label: "Description", type: "textarea" },
    { name: "image", label: "Image URL", type: "text" },
    { name: "url", label: "Page URL", type: "text" },
    { name: "type", label: "Type", type: "select", defaultValue: "website", options: [
      { label: "website", value: "website" }, { label: "article", value: "article" }, { label: "product", value: "product" }, { label: "video", value: "video" },
    ] },
    { name: "siteName", label: "Site name", type: "text" },
  ],
  "twitter-card": [
    { name: "card", label: "Card type", type: "select", defaultValue: "summary_large_image", options: [
      { label: "Summary with large image", value: "summary_large_image" }, { label: "Summary", value: "summary" }, { label: "App", value: "app" }, { label: "Player", value: "player" },
    ] },
    { name: "title", label: "Title", type: "text", required: true },
    { name: "description", label: "Description", type: "textarea" },
    { name: "image", label: "Image URL", type: "text" },
    { name: "site", label: "@site handle", type: "text" },
    { name: "creator", label: "@creator handle", type: "text" },
  ],
  "keyword-density": [
    { name: "text", label: "Text to analyze", type: "textarea", required: true },
    { name: "targetKeyword", label: "Target keyword (optional)", type: "text" },
  ],
  "regex-tester": [
    { name: "pattern", label: "Pattern", type: "text", required: true, placeholder: "\\d+" },
    { name: "flags", label: "Flags", type: "text", placeholder: "gi" },
    { name: "testString", label: "Test string", type: "textarea", required: true },
  ],
  "lorem-ipsum": [
    { name: "count", label: "Count", type: "number", defaultValue: 3, min: 1 },
    { name: "unit", label: "Unit", type: "select", defaultValue: "paragraphs", options: [
      { label: "Paragraphs", value: "paragraphs" }, { label: "Sentences", value: "sentences" }, { label: "Words", value: "words" },
    ] },
  ],
  "diff-checker": [
    { name: "textA", label: "Original text", type: "textarea", required: true },
    { name: "textB", label: "Changed text", type: "textarea", required: true },
  ],
  "gitignore-generator": [
    { name: "stacks", label: "Stacks to include", type: "multiselect", options: [
      { label: "Node.js", value: "node" }, { label: "Python", value: "python" }, { label: "Java", value: "java" }, { label: "Go", value: "go" },
      { label: "Rust", value: "rust" }, { label: "macOS", value: "macos" }, { label: "Windows", value: "windows" },
      { label: "JetBrains IDEs", value: "jetbrains" }, { label: "VS Code", value: "vscode" },
    ] },
  ],
  "htaccess-generator": [
    { name: "forceHttps", label: "Force HTTPS redirect", type: "checkbox" },
    { name: "wwwRedirect", label: "www handling", type: "select", defaultValue: "", options: [
      { label: "No change", value: "" }, { label: "Add www", value: "add" }, { label: "Remove www", value: "remove" },
    ] },
  ],
  "contract-builder": [
    { name: "type", label: "Contract type", type: "select", defaultValue: "nda", options: [{ label: "NDA", value: "nda" }, { label: "Freelance agreement", value: "freelance" }] },
    { name: "partyA", label: "Party A", type: "text", required: true },
    { name: "partyB", label: "Party B", type: "text", required: true },
    { name: "date", label: "Date (optional)", type: "date" },
    { name: "jurisdiction", label: "Governing jurisdiction (optional)", type: "text" },
    { name: "purpose", label: "Purpose", type: "text", showIf: { field: "type", equals: "nda" } },
    { name: "termMonths", label: "Term (months)", type: "number", showIf: { field: "type", equals: "nda" } },
    { name: "scope", label: "Scope of work", type: "textarea", showIf: { field: "type", equals: "freelance" } },
    { name: "fee", label: "Fee", type: "text", showIf: { field: "type", equals: "freelance" } },
    { name: "paymentTerms", label: "Payment terms", type: "text", showIf: { field: "type", equals: "freelance" } },
  ],
  "password-generator": [
    { name: "length", label: "Length", type: "number", defaultValue: 16, min: 4, max: 128 },
    { name: "count", label: "How many", type: "number", defaultValue: 1, min: 1, max: 100 },
    { name: "uppercase", label: "Uppercase letters (A-Z)", type: "checkbox", defaultValue: true },
    { name: "lowercase", label: "Lowercase letters (a-z)", type: "checkbox", defaultValue: true },
    { name: "numbers", label: "Numbers (0-9)", type: "checkbox", defaultValue: true },
    { name: "symbols", label: "Symbols (!@#$...)", type: "checkbox", defaultValue: false },
    { name: "excludeAmbiguous", label: "Exclude ambiguous characters (0, O, l, 1, I)", type: "checkbox", defaultValue: false },
  ],
  "case-converter": [
    { name: "text", label: "Text", type: "textarea", required: true },
    { name: "caseType", label: "Convert to", type: "select", defaultValue: "upper", options: [
      { label: "UPPERCASE", value: "upper" }, { label: "lowercase", value: "lower" },
      { label: "Title Case", value: "title" }, { label: "Sentence case", value: "sentence" },
      { label: "camelCase", value: "camel" }, { label: "PascalCase", value: "pascal" },
      { label: "snake_case", value: "snake" }, { label: "kebab-case", value: "kebab" },
      { label: "CONSTANT_CASE", value: "constant" },
    ] },
  ],
};

export function hasFormFields(toolId: string): boolean {
  return toolId in TOOL_FIELDS;
}
