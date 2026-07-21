// ─── Toolforge — Central Tool Registry ───────────────────────────────────────
// Single source of truth for all 181 tools.
// Consumed by: pages, API routes, SEO engine, orchestrator, sitemap.

export type ToolCategory =
  | "pdf"
  | "image"
  | "audio"
  | "developer"
  | "seo"
  | "writing"
  | "calculator"
  | "design"
  | "ai-content"
  | "ai-audio"
  | "ai-image"
  | "ai-seo"
  | "ai-chatbot"
  | "ai-business"
  | "ai-email"
  | "ai-language";

export interface Tool {
  id: string;           // URL-safe slug: "pdf-merge"
  name: string;         // Display name: "Merge PDF"
  description: string;  // Short description for cards and meta
  category: ToolCategory;
  isPremium: boolean;   // true = AI tool (Pro plan required)
  icon: string;         // emoji icon
  apiProvider?: string; // openai | elevenlabs | stability | etc.
  creditsPerUse?: number;
  isNew?: boolean;
  tags?: string[];
}

// ─── FREE TOOLS (No AI) ──────────────────────────────────────────────────────

export const FREE_TOOLS: Tool[] = [
  // PDF Tools
  { id: "pdf-merge",           name: "Merge PDF",              description: "Combine multiple PDF files into one document",                   category: "pdf",       isPremium: false, icon: "📄", tags: ["pdf","merge","combine"] },
  { id: "pdf-split",           name: "Split PDF",              description: "Split a PDF into individual pages or page ranges",               category: "pdf",       isPremium: false, icon: "✂️", tags: ["pdf","split","separate"] },
  { id: "pdf-compress",        name: "Compress PDF",           description: "Reduce PDF file size while maintaining quality",                 category: "pdf",       isPremium: false, icon: "🗜️", tags: ["pdf","compress","reduce"] },
  { id: "pdf-to-word",         name: "PDF to Word",            description: "Convert PDF documents to editable Word files",                   category: "pdf",       isPremium: false, icon: "📝", tags: ["pdf","word","convert"] },
  { id: "word-to-pdf",         name: "Word to PDF",            description: "Convert Word documents to PDF format",                           category: "pdf",       isPremium: false, icon: "📋", tags: ["word","pdf","convert"] },
  { id: "pdf-to-jpg",          name: "PDF to JPG",             description: "Convert PDF pages to high-quality JPG images",                   category: "pdf",       isPremium: false, icon: "🖼️", tags: ["pdf","jpg","image"] },
  { id: "jpg-to-pdf",          name: "JPG to PDF",             description: "Convert JPG images to PDF documents",                            category: "pdf",       isPremium: false, icon: "🖼️", tags: ["jpg","pdf","convert"] },
  { id: "pdf-ocr",             name: "PDF OCR",                description: "Make scanned PDFs searchable — extracts text in 14 languages",   category: "pdf",       isPremium: false, icon: "🔍", tags: ["pdf","ocr","text","scan"] },
  { id: "pdf-rotate",          name: "Rotate PDF",             description: "Rotate PDF pages by 90, 180 or 270 degrees",                    category: "pdf",       isPremium: false, icon: "🔄", tags: ["pdf","rotate"] },
  { id: "pdf-unlock",          name: "Unlock PDF",             description: "Remove password protection from PDF files",                      category: "pdf",       isPremium: false, icon: "🔓", tags: ["pdf","unlock","password"] },
  { id: "pdf-protect",         name: "Protect PDF",            description: "Add password protection to your PDF files",                      category: "pdf",       isPremium: false, icon: "🔒", tags: ["pdf","protect","password"] },
  { id: "pdf-watermark",       name: "Add Watermark",          description: "Add text or image watermarks to PDF pages",                      category: "pdf",       isPremium: false, icon: "💧", tags: ["pdf","watermark"] },
  { id: "pdf-page-numbers",    name: "Add Page Numbers",       description: "Add page numbers to PDF documents",                              category: "pdf",       isPremium: false, icon: "🔢", tags: ["pdf","page numbers"] },
  { id: "pdf-remove-pages",    name: "Remove PDF Pages",       description: "Delete specific pages from a PDF document",                      category: "pdf",       isPremium: false, icon: "🗑️", tags: ["pdf","remove","pages"] },
  { id: "pdf-extract-pages",   name: "Extract PDF Pages",      description: "Extract specific pages from a PDF into a new file",              category: "pdf",       isPremium: false, icon: "📤", tags: ["pdf","extract","pages"] },
  { id: "pdf-metadata",        name: "PDF Metadata Editor",    description: "View and edit PDF metadata (title, author, keywords)",           category: "pdf",       isPremium: false, icon: "ℹ️", tags: ["pdf","metadata"] },
  { id: "pdf-sign",            name: "PDF Signer",             description: "Add digital signatures to PDF documents",                        category: "pdf",       isPremium: false, icon: "✍️", tags: ["pdf","sign","signature"] },
  { id: "pdf-organize",        name: "PDF Organizer",          description: "Drag and reorder pages in your PDF visually",                    category: "pdf",       isPremium: false, icon: "📑", tags: ["pdf","organize","reorder"] },

  // Image Tools
  { id: "image-compress",      name: "Image Compressor",       description: "Compress images without visible quality loss",                   category: "image",     isPremium: false, icon: "🗜️", tags: ["image","compress","optimize"] },
  { id: "image-resize",        name: "Image Resizer",          description: "Resize images to any dimension while preserving aspect ratio",   category: "image",     isPremium: false, icon: "↔️", tags: ["image","resize","dimensions"] },
  { id: "image-crop",          name: "Crop Image",             description: "Crop images to custom dimensions or aspect ratios",              category: "image",     isPremium: false, icon: "✂️", tags: ["image","crop"] },
  { id: "image-rotate",        name: "Rotate Image",           description: "Rotate images by any angle",                                     category: "image",     isPremium: false, icon: "🔄", tags: ["image","rotate"] },
  { id: "image-convert",       name: "Image Converter",        description: "Convert between JPG, PNG, WebP, AVIF, and SVG formats",          category: "image",     isPremium: false, icon: "🔀", tags: ["image","convert","jpg","png","webp"] },
  { id: "svg-converter",       name: "SVG Converter",          description: "Convert SVG files to PNG, JPG or WebP",                          category: "image",     isPremium: false, icon: "🎨", tags: ["svg","convert","image"] },
  { id: "favicon-generator",   name: "Favicon Generator",      description: "Generate favicon.ico and all required sizes from any image",     category: "image",     isPremium: false, icon: "⭐", tags: ["favicon","icon","generator"] },
  { id: "image-to-base64",     name: "Image to Base64",        description: "Convert images to Base64 encoded strings",                       category: "image",     isPremium: false, icon: "🔤", tags: ["image","base64","encode"] },
  { id: "base64-to-image",     name: "Base64 to Image",        description: "Decode Base64 strings back to image files",                      category: "image",     isPremium: false, icon: "🖼️", tags: ["base64","image","decode"] },
  { id: "color-picker",        name: "Color Picker",           description: "Pick colors from any image and get HEX, RGB, HSL values",       category: "image",     isPremium: false, icon: "🎨", tags: ["color","picker","hex","rgb"] },
  { id: "hex-to-rgb",          name: "HEX to RGB",             description: "Convert HEX color codes to RGB and HSL values",                 category: "image",     isPremium: false, icon: "🎨", tags: ["hex","rgb","color","convert"] },
  { id: "rgb-to-hex",          name: "RGB to HEX",             description: "Convert RGB color values to HEX color codes",                   category: "image",     isPremium: false, icon: "🎨", tags: ["rgb","hex","color","convert"] },
  { id: "image-metadata",      name: "Image Metadata Viewer",  description: "View EXIF metadata, GPS data and camera info from images",      category: "image",     isPremium: false, icon: "ℹ️", tags: ["image","exif","metadata"] },
  { id: "image-metadata-remove", name: "Remove Image Metadata", description: "Strip EXIF data and metadata from images for privacy",         category: "image",     isPremium: false, icon: "🗑️", tags: ["image","exif","privacy","remove"] },
  { id: "qr-generator",        name: "QR Code Generator",      description: "Generate QR codes for URLs, text, WiFi, vCard and more",        category: "image",     isPremium: false, icon: "📱", tags: ["qr","code","generator"] },
  { id: "barcode-generator",   name: "Barcode Generator",      description: "Generate barcodes in EAN-13, Code 128, UPC and other formats",  category: "image",     isPremium: false, icon: "📊", tags: ["barcode","generator"] },

  // Audio Tools
  { id: "audio-converter",     name: "Audio Converter",        description: "Convert audio between MP3, WAV, OGG and FLAC formats",          category: "audio",     isPremium: false, icon: "🎵", tags: ["audio","convert","mp3","wav"] },
  { id: "audio-watermark",     name: "Audio Watermark",        description: "Mix a watermark clip into your track to protect preview audio", category: "audio",     isPremium: false, icon: "🎧", tags: ["audio","watermark","protect"] },

  // Developer Tools
  { id: "json-formatter",      name: "JSON Formatter",         description: "Format, validate and beautify JSON with syntax highlighting",   category: "developer", isPremium: false, icon: "{ }", tags: ["json","format","validate","beautify"] },
  { id: "json-minifier",       name: "JSON Minifier",          description: "Minify and compress JSON by removing whitespace",               category: "developer", isPremium: false, icon: "{ }", tags: ["json","minify","compress"] },
  { id: "json-viewer",         name: "JSON Viewer",            description: "Interactive tree view for exploring complex JSON data",          category: "developer", isPremium: false, icon: "🌳", tags: ["json","viewer","tree"] },
  { id: "xml-formatter",       name: "XML Formatter",          description: "Format and validate XML documents",                             category: "developer", isPremium: false, icon: "📋", tags: ["xml","format","validate"] },
  { id: "yaml-formatter",      name: "YAML Formatter",         description: "Format, lint and validate YAML files",                          category: "developer", isPremium: false, icon: "📋", tags: ["yaml","format","lint"] },
  { id: "csv-to-json",         name: "CSV to JSON",            description: "Convert CSV files or data to JSON format",                      category: "developer", isPremium: false, icon: "🔀", tags: ["csv","json","convert"] },
  { id: "json-to-csv",         name: "JSON to CSV",            description: "Convert JSON arrays to CSV format",                             category: "developer", isPremium: false, icon: "🔀", tags: ["json","csv","convert"] },
  { id: "sql-formatter",       name: "SQL Formatter",          description: "Format and beautify SQL queries with syntax highlighting",      category: "developer", isPremium: false, icon: "🗄️", tags: ["sql","format","beautify"] },
  { id: "html-formatter",      name: "HTML Formatter",         description: "Format and beautify HTML code",                                 category: "developer", isPremium: false, icon: "🌐", tags: ["html","format","beautify"] },
  { id: "css-formatter",       name: "CSS Formatter",          description: "Format and beautify CSS stylesheets",                           category: "developer", isPremium: false, icon: "🎨", tags: ["css","format","beautify"] },
  { id: "js-beautifier",       name: "JS Beautifier",          description: "Format and beautify JavaScript code",                           category: "developer", isPremium: false, icon: "⚡", tags: ["javascript","format","beautify"] },
  { id: "js-minifier",         name: "JS Minifier",            description: "Minify JavaScript code for production",                         category: "developer", isPremium: false, icon: "⚡", tags: ["javascript","minify","compress"] },
  { id: "css-minifier",        name: "CSS Minifier",           description: "Minify CSS stylesheets for production",                         category: "developer", isPremium: false, icon: "🎨", tags: ["css","minify","compress"] },
  { id: "html-minifier",       name: "HTML Minifier",          description: "Minify HTML documents by removing whitespace and comments",     category: "developer", isPremium: false, icon: "🌐", tags: ["html","minify","compress"] },
  { id: "markdown-preview",    name: "Markdown Preview",       description: "Live preview and render Markdown as formatted HTML",            category: "developer", isPremium: false, icon: "📝", tags: ["markdown","preview","render"] },
  { id: "markdown-convert",    name: "Markdown Converter",     description: "Convert Markdown to HTML, PDF or plain text",                  category: "developer", isPremium: false, icon: "🔀", tags: ["markdown","convert","html"] },
  { id: "regex-tester",        name: "Regex Tester",           description: "Test and debug regular expressions with live matching",         category: "developer", isPremium: false, icon: "🔍", tags: ["regex","tester","regexp"] },
  { id: "uuid-generator",      name: "UUID Generator",         description: "Generate UUIDs v1, v4 in bulk",                                 category: "developer", isPremium: false, icon: "🆔", tags: ["uuid","generator","id"] },
  { id: "hash-generator",      name: "Hash Generator",         description: "Generate MD5, SHA-1, SHA-256 and SHA-512 hashes",              category: "developer", isPremium: false, icon: "#️⃣", tags: ["hash","md5","sha256","generator"] },
  { id: "jwt-decoder",         name: "JWT Decoder",            description: "Decode and inspect JWT tokens (header, payload, signature)",   category: "developer", isPremium: false, icon: "🔑", tags: ["jwt","decode","token"] },
  { id: "jwt-encoder",         name: "JWT Encoder",            description: "Encode JWT tokens with custom payload and secret",             category: "developer", isPremium: false, icon: "🔑", tags: ["jwt","encode","token"] },
  { id: "base64-encoder",      name: "Base64 Encoder/Decoder", description: "Encode and decode text or files to/from Base64",              category: "developer", isPremium: false, icon: "🔤", tags: ["base64","encode","decode"] },
  { id: "url-encoder",         name: "URL Encoder/Decoder",    description: "Encode and decode URLs and URI components",                    category: "developer", isPremium: false, icon: "🔗", tags: ["url","encode","decode"] },
  { id: "lorem-ipsum",         name: "Lorem Ipsum Generator",  description: "Generate Lorem Ipsum placeholder text in any length",          category: "developer", isPremium: false, icon: "📄", tags: ["lorem","ipsum","placeholder","text"] },
  { id: "diff-checker",        name: "Diff Checker",           description: "Compare two texts or code files and highlight differences",    category: "developer", isPremium: false, icon: "🔄", tags: ["diff","compare","text","code"] },
  { id: "cron-generator",      name: "Cron Expression Generator", description: "Build and explain cron expressions with a visual editor",  category: "developer", isPremium: false, icon: "⏰", tags: ["cron","expression","scheduler"] },
  { id: "gitignore-generator", name: ".gitignore Generator",   description: "Generate .gitignore files for any language or framework",     category: "developer", isPremium: false, icon: "🙈", tags: ["gitignore","git","generator"] },
  { id: "ip-lookup",           name: "IP Address Lookup",      description: "Look up geolocation and info for any IP address",             category: "developer", isPremium: false, icon: "🌍", tags: ["ip","lookup","geolocation"] },
  { id: "webhook-tester",      name: "Webhook Tester",         description: "Test and inspect incoming webhooks with a temporary URL",      category: "developer", isPremium: false, icon: "🔌", tags: ["webhook","tester","http"] },
  { id: "htaccess-generator",  name: ".htaccess Generator",    description: "Generate Apache .htaccess rules for redirects, auth and more", category: "developer", isPremium: false, icon: "⚙️", tags: ["htaccess","apache","generator"] },

  // SEO Tools
  { id: "meta-tag-generator",  name: "Meta Tag Generator",     description: "Generate complete HTML meta tags for any webpage",             category: "seo",       isPremium: false, icon: "🏷️", tags: ["meta","seo","tags","html"] },
  { id: "robots-txt",          name: "Robots.txt Generator",   description: "Generate robots.txt file to control search engine crawling",   category: "seo",       isPremium: false, icon: "🤖", tags: ["robots","txt","seo","crawl"] },
  { id: "sitemap-generator",   name: "Sitemap Generator",      description: "Generate XML sitemaps from a list of URLs",                   category: "seo",       isPremium: false, icon: "🗺️", tags: ["sitemap","xml","seo"] },
  { id: "og-generator",        name: "Open Graph Generator",   description: "Generate Open Graph tags for social media sharing previews",  category: "seo",       isPremium: false, icon: "📱", tags: ["og","opengraph","social","meta"] },
  { id: "twitter-card",        name: "Twitter Card Generator", description: "Generate Twitter Card meta tags for rich link previews",       category: "seo",       isPremium: false, icon: "🐦", tags: ["twitter","card","meta","social"] },
  { id: "canonical-url",       name: "Canonical URL Generator", description: "Generate canonical link tags to prevent duplicate content",   category: "seo",       isPremium: false, icon: "🔗", tags: ["canonical","url","seo"] },
  { id: "schema-generator",    name: "Schema Generator",       description: "Generate JSON-LD structured data for rich search results",    category: "seo",       isPremium: false, icon: "📊", tags: ["schema","json-ld","structured-data","seo"] },
  { id: "hreflang-generator",  name: "Hreflang Generator",     description: "Generate hreflang tags for international SEO",               category: "seo",       isPremium: false, icon: "🌍", tags: ["hreflang","international","seo"] },
  { id: "http-header-checker", name: "HTTP Header Checker",    description: "Inspect HTTP response headers for any URL",                   category: "seo",       isPremium: false, icon: "📡", tags: ["http","headers","checker"] },
  { id: "redirect-checker",    name: "Redirect Checker",       description: "Trace redirect chains for any URL",                           category: "seo",       isPremium: false, icon: "↪️", tags: ["redirect","checker","301","302"] },
  { id: "keyword-density",     name: "Keyword Density Checker", description: "Analyze keyword density and frequency in any text",          category: "seo",       isPremium: false, icon: "📊", tags: ["keyword","density","seo","analyze"] },
  { id: "word-counter",        name: "Word Counter",            description: "Count words, characters, sentences and reading time",        category: "seo",       isPremium: false, icon: "🔢", tags: ["word","counter","character","count"] },
  { id: "html-encode",         name: "HTML Encoder/Decoder",   description: "Encode special characters to HTML entities and decode back", category: "seo",       isPremium: false, icon: "🔤", tags: ["html","encode","decode","entities"] },

  // Writing Tools
  { id: "case-converter",      name: "Case Converter",         description: "Convert text between UPPERCASE, lowercase, Title Case, camelCase", category: "writing", isPremium: false, icon: "🔤", tags: ["case","convert","text","uppercase"] },
  { id: "remove-duplicates",   name: "Remove Duplicate Lines", description: "Remove duplicate lines from text instantly",                  category: "writing",   isPremium: false, icon: "🗑️", tags: ["duplicate","lines","remove","text"] },
  { id: "remove-spaces",       name: "Remove Extra Spaces",    description: "Remove extra whitespace, tabs and blank lines from text",     category: "writing",   isPremium: false, icon: "⬜", tags: ["spaces","whitespace","remove","clean"] },
  { id: "sort-text",           name: "Alphabetical Sort",      description: "Sort lines of text alphabetically (A-Z or Z-A)",             category: "writing",   isPremium: false, icon: "🔡", tags: ["sort","alphabetical","text","lines"] },
  { id: "reverse-text",        name: "Reverse Text",           description: "Reverse text, words or lines instantly",                     category: "writing",   isPremium: false, icon: "🔁", tags: ["reverse","text","flip"] },
  { id: "password-generator",  name: "Password Generator",     description: "Generate strong, secure passwords with custom rules",        category: "writing",   isPremium: false, icon: "🔐", tags: ["password","generator","secure","random"] },
  { id: "username-generator",  name: "Username Generator",     description: "Generate unique usernames for any platform",                 category: "writing",   isPremium: false, icon: "👤", tags: ["username","generator","random"] },
  { id: "slug-generator",      name: "Slug Generator",         description: "Convert any text to URL-friendly slugs",                    category: "writing",   isPremium: false, icon: "🔗", tags: ["slug","url","generator","seo"] },
  { id: "word-to-html",        name: "Word to HTML",           description: "Convert Word document content to clean HTML",               category: "writing",   isPremium: false, icon: "🔀", tags: ["word","html","convert"] },
  { id: "invoice-generator",   name: "Invoice Generator",      description: "Create professional invoices and download as PDF",          category: "writing",   isPremium: false, icon: "🧾", tags: ["invoice","generator","pdf","billing"], isNew: true },
  { id: "resume-builder",      name: "Resume Builder",         description: "Build a professional resume and export as PDF",             category: "writing",   isPremium: false, icon: "📋", tags: ["resume","cv","builder","pdf"], isNew: true },
  { id: "contract-builder",    name: "Contract Builder",       description: "Generate legal contract templates (NDA, freelance, etc.)",  category: "writing",   isPremium: false, icon: "📜", tags: ["contract","nda","legal","template"] },

  // Calculators
  { id: "bmi-calculator",      name: "BMI Calculator",         description: "Calculate Body Mass Index with health range indicators",    category: "calculator", isPremium: false, icon: "⚖️", tags: ["bmi","calculator","health","weight"] },
  { id: "age-calculator",      name: "Age Calculator",         description: "Calculate exact age in years, months and days from birthdate", category: "calculator", isPremium: false, icon: "📅", tags: ["age","calculator","birthday","date"] },
  { id: "loan-calculator",     name: "Loan / EMI Calculator",  description: "Calculate monthly EMI, total interest and amortization schedule", category: "calculator", isPremium: false, icon: "💰", tags: ["loan","emi","calculator","finance"] },
  { id: "mortgage-calculator", name: "Mortgage Calculator",    description: "Calculate monthly mortgage payments, total interest paid", category: "calculator", isPremium: false, icon: "🏠", tags: ["mortgage","calculator","home","loan"] },
  { id: "gst-calculator",      name: "GST / VAT Calculator",   description: "Calculate GST and VAT inclusive and exclusive amounts",   category: "calculator", isPremium: false, icon: "🧾", tags: ["gst","vat","tax","calculator"] },
  { id: "profit-calculator",   name: "Profit Margin Calculator", description: "Calculate profit margin, markup and revenue",           category: "calculator", isPremium: false, icon: "📈", tags: ["profit","margin","calculator","business"] },
  { id: "percentage-calculator", name: "Percentage Calculator", description: "Calculate percentages, increases, decreases and ratios", category: "calculator", isPremium: false, icon: "%", tags: ["percentage","calculator","math"] },
  { id: "currency-converter",  name: "Currency Converter",     description: "Convert between 30 major currencies with daily ECB exchange rates", category: "calculator", isPremium: false, icon: "💱", tags: ["currency","converter","exchange","rates"] },
  { id: "timezone-calculator", name: "Time Zone Calculator",   description: "Convert times between any time zones worldwide",          category: "calculator", isPremium: false, icon: "🕐", tags: ["timezone","time","convert","world"] },
  { id: "pregnancy-calculator", name: "Pregnancy Calculator",  description: "Calculate due date, gestational age and pregnancy milestones", category: "calculator", isPremium: false, icon: "🤱", tags: ["pregnancy","due date","calculator","health"] },
  { id: "calorie-calculator",  name: "Calorie Calculator",     description: "Calculate daily caloric needs based on activity level",  category: "calculator", isPremium: false, icon: "🍎", tags: ["calorie","calculator","health","diet"] },
  { id: "bmr-calculator",      name: "BMR Calculator",         description: "Calculate Basal Metabolic Rate and daily caloric needs", category: "calculator", isPremium: false, icon: "🔥", tags: ["bmr","calculator","metabolism","health"] },
  { id: "fuel-calculator",     name: "Fuel Cost Calculator",   description: "Calculate fuel costs and consumption for road trips",    category: "calculator", isPremium: false, icon: "⛽", tags: ["fuel","cost","calculator","car"] },
  { id: "roi-calculator",      name: "ROI Calculator",         description: "Calculate Return on Investment for any project or campaign", category: "calculator", isPremium: false, icon: "📊", tags: ["roi","calculator","investment","business"] },
  { id: "mrr-calculator",      name: "SaaS MRR Calculator",    description: "Calculate Monthly Recurring Revenue, ARR and growth metrics", category: "calculator", isPremium: false, icon: "📈", tags: ["mrr","arr","saas","calculator"] },
  { id: "meeting-cost",        name: "Meeting Cost Calculator", description: "Calculate the real cost of meetings based on attendees and salaries", category: "calculator", isPremium: false, icon: "💼", tags: ["meeting","cost","calculator","productivity"] },

  // Design & CSS Tools
  { id: "color-palette",       name: "Color Palette Generator", description: "Generate beautiful color palettes from a base color",    category: "design",    isPremium: false, icon: "🎨", tags: ["color","palette","generator","design"] },
  { id: "gradient-generator",  name: "Gradient Generator",     description: "Create CSS gradients visually and copy the code",        category: "design",    isPremium: false, icon: "🌈", tags: ["gradient","css","generator","design"] },
  { id: "box-shadow",          name: "CSS Box Shadow Generator", description: "Generate CSS box-shadow effects with live preview",     category: "design",    isPremium: false, icon: "◻️", tags: ["css","box-shadow","generator","design"] },
  { id: "button-generator",    name: "CSS Button Generator",   description: "Design CSS buttons with hover effects and copy code",    category: "design",    isPremium: false, icon: "🔘", tags: ["css","button","generator","design"] },
  { id: "animation-generator", name: "CSS Animation Generator", description: "Generate CSS @keyframe animations visually",           category: "design",    isPremium: false, icon: "✨", tags: ["css","animation","keyframe","generator"] },
  { id: "grid-generator",      name: "CSS Grid Generator",     description: "Build CSS Grid layouts visually and export code",       category: "design",    isPremium: false, icon: "⬛", tags: ["css","grid","layout","generator"] },
  { id: "flexbox-generator",   name: "Flexbox Generator",      description: "Build CSS Flexbox layouts visually and export code",    category: "design",    isPremium: false, icon: "📦", tags: ["css","flexbox","layout","generator"] },
  { id: "svg-blob-generator",  name: "SVG Blob Generator",     description: "Generate organic SVG blob shapes for backgrounds and decorations", category: "design", isPremium: false, icon: "💧", tags: ["svg","blob","generator","design"] },
];

// ─── AI / PREMIUM TOOLS ──────────────────────────────────────────────────────

export const AI_TOOLS: Tool[] = [
  // AI Writing & Content
  { id: "ai-blog-writer",         name: "AI Blog Writer",              description: "Generate full SEO-optimized blog posts with AI",                   category: "ai-content",  isPremium: true, icon: "✍️",  apiProvider: "openai",     creditsPerUse: 3 },
  { id: "ai-content-repurposer",  name: "AI Content Repurposer",       description: "Turn one piece of content into tweets, LinkedIn posts, emails",     category: "ai-content",  isPremium: true, icon: "♻️",  apiProvider: "openai",     creditsPerUse: 2 },
  { id: "ai-cold-email",          name: "AI Cold Email Generator",      description: "Generate personalized cold email sequences that convert",           category: "ai-content",  isPremium: true, icon: "📧",  apiProvider: "openai",     creditsPerUse: 1 },
  { id: "ai-product-description", name: "AI Product Description",       description: "Write compelling product descriptions for e-commerce",             category: "ai-content",  isPremium: true, icon: "🛍️",  apiProvider: "openai",     creditsPerUse: 1 },
  { id: "ai-job-description",     name: "AI Job Description Generator", description: "Create professional job postings that attract top talent",         category: "ai-content",  isPremium: true, icon: "💼",  apiProvider: "openai",     creditsPerUse: 1 },
  { id: "ai-ad-copy",             name: "AI Ad Copy Generator",         description: "Generate high-converting ad copy for Google, Meta, LinkedIn",      category: "ai-content",  isPremium: true, icon: "📢",  apiProvider: "openai",     creditsPerUse: 1 },
  { id: "ai-youtube-script",      name: "AI YouTube Script Writer",     description: "Write engaging YouTube video scripts with hooks and CTAs",         category: "ai-content",  isPremium: true, icon: "🎬",  apiProvider: "openai",     creditsPerUse: 2 },
  { id: "ai-newsletter",          name: "AI Newsletter Writer",         description: "Generate engaging email newsletters for your audience",             category: "ai-content",  isPremium: true, icon: "📰",  apiProvider: "openai",     creditsPerUse: 2 },
  { id: "ai-linkedin-post",       name: "AI LinkedIn Post Generator",   description: "Generate viral LinkedIn posts with optimal formatting",            category: "ai-content",  isPremium: true, icon: "💼",  apiProvider: "openai",     creditsPerUse: 1 },
  { id: "ai-twitter-thread",      name: "AI Twitter Thread Generator",  description: "Create engaging Twitter/X threads on any topic",                  category: "ai-content",  isPremium: true, icon: "🐦",  apiProvider: "openai",     creditsPerUse: 1 },
  { id: "ai-paraphraser",         name: "AI Paraphraser",               description: "Rewrite content in different styles while preserving meaning",     category: "ai-content",  isPremium: true, icon: "🔄",  apiProvider: "openai",     creditsPerUse: 1 },
  { id: "ai-grammar-checker",     name: "AI Grammar Checker",           description: "Fix grammar, spelling and style with AI-powered suggestions",      category: "ai-content",  isPremium: true, icon: "✅",  apiProvider: "openai",     creditsPerUse: 1 },
  { id: "ai-summarizer",          name: "AI Summarizer",                description: "Summarize articles, documents and URLs in seconds",                category: "ai-content",  isPremium: true, icon: "📋",  apiProvider: "openai",     creditsPerUse: 1 },
  { id: "ai-cover-letter",        name: "AI Cover Letter Generator",    description: "Create tailored cover letters for any job application",            category: "ai-content",  isPremium: true, icon: "📄",  apiProvider: "openai",     creditsPerUse: 1 },
  { id: "ai-resume-reviewer",     name: "AI Resume Reviewer",           description: "Get AI-powered feedback and optimization for your resume",         category: "ai-content",  isPremium: true, icon: "📋",  apiProvider: "openai",     creditsPerUse: 2 },
  { id: "ai-proposal-writer",     name: "AI Proposal Writer",           description: "Generate professional business proposals and pitches",             category: "ai-content",  isPremium: true, icon: "📊",  apiProvider: "openai",     creditsPerUse: 3 },
  { id: "ai-press-release",       name: "AI Press Release Generator",   description: "Write professional press releases for any announcement",           category: "ai-content",  isPremium: true, icon: "📰",  apiProvider: "openai",     creditsPerUse: 2 },
  { id: "ai-faq-generator",       name: "AI FAQ Generator",             description: "Generate comprehensive FAQ sections for any topic or product",     category: "ai-content",  isPremium: true, icon: "❓",  apiProvider: "openai",     creditsPerUse: 1 },
  { id: "ai-meta-description",    name: "AI Meta Description Generator", description: "Write click-worthy meta descriptions for better CTR",            category: "ai-content",  isPremium: true, icon: "🏷️",  apiProvider: "openai",     creditsPerUse: 1 },
  { id: "ai-title-generator",     name: "AI Title Generator",           description: "Generate compelling titles and headlines for any content",         category: "ai-content",  isPremium: true, icon: "✨",  apiProvider: "openai",     creditsPerUse: 1 },

  // AI Audio & Video
  { id: "ai-transcription",       name: "AI Transcription",             description: "Transcribe audio and video to text with 99% accuracy",            category: "ai-audio",    isPremium: true, icon: "🎙️",  apiProvider: "whisper",    creditsPerUse: 4 },
  { id: "ai-subtitle-generator",  name: "AI Subtitle Generator",        description: "Auto-generate SRT/VTT subtitles for any video",                   category: "ai-audio",    isPremium: true, icon: "💬",  apiProvider: "whisper",    creditsPerUse: 4 },
  { id: "ai-podcast-to-blog",     name: "Podcast to Blog Converter",    description: "Convert podcast episodes to full blog posts automatically",        category: "ai-audio",    isPremium: true, icon: "🎙️",  apiProvider: "whisper",    creditsPerUse: 6 },
  { id: "ai-text-to-speech",      name: "AI Text-to-Speech",            description: "Convert text to natural human-sounding speech in 30+ voices",     category: "ai-audio",    isPremium: true, icon: "🔊",  apiProvider: "elevenlabs", creditsPerUse: 3 },
  { id: "ai-voice-clone",         name: "AI Voice Cloning",             description: "Clone any voice and generate speech with it",                      category: "ai-audio",    isPremium: true, icon: "🎤",  apiProvider: "elevenlabs", creditsPerUse: 10 },
  { id: "ai-meeting-summary",     name: "AI Meeting Summarizer",        description: "Upload meeting recordings and get AI-generated summaries",         category: "ai-audio",    isPremium: true, icon: "📝",  apiProvider: "whisper",    creditsPerUse: 5 },
  { id: "ai-youtube-summarizer",  name: "AI YouTube Summarizer",        description: "Summarize any YouTube video by URL",                               category: "ai-audio",    isPremium: true, icon: "▶️",  apiProvider: "whisper",    creditsPerUse: 4 },

  // AI Image Tools
  { id: "ai-image-generator",     name: "AI Image Generator",           description: "Generate stunning images from text prompts with DALL·E 3",        category: "ai-image",    isPremium: true, icon: "🎨",  apiProvider: "openai",     creditsPerUse: 5 },
  { id: "ai-background-remover",  name: "AI Background Remover",        description: "Remove image backgrounds instantly with AI",                       category: "ai-image",    isPremium: true, icon: "✂️",  apiProvider: "removebg",   creditsPerUse: 3 },
  { id: "ai-image-upscaler",      name: "AI Image Upscaler",            description: "Upscale images up to 4x without quality loss",                    category: "ai-image",    isPremium: true, icon: "🔭",  apiProvider: "replicate",  creditsPerUse: 4 },
  { id: "ai-background-replacer", name: "AI Background Replacer",       description: "Replace image backgrounds with AI-generated scenes",               category: "ai-image",    isPremium: true, icon: "🖼️",  apiProvider: "stability",  creditsPerUse: 5 },
  { id: "ai-photo-enhancer",      name: "AI Photo Enhancer",            description: "Enhance and restore old or low-quality photos with AI",            category: "ai-image",    isPremium: true, icon: "✨",  apiProvider: "replicate",  creditsPerUse: 4 },
  { id: "ai-object-remover",      name: "AI Object Remover",            description: "Remove objects from images with AI inpainting",                   category: "ai-image",    isPremium: true, icon: "🗑️",  apiProvider: "stability",  creditsPerUse: 5 },
  { id: "ai-headshot-generator",  name: "AI Headshot Generator",        description: "Generate professional headshots from selfies with AI",             category: "ai-image",    isPremium: true, icon: "👤",  apiProvider: "replicate",  creditsPerUse: 8 },
  { id: "ai-logo-generator",      name: "AI Logo Generator",            description: "Generate unique logos and brand visuals with AI",                  category: "ai-image",    isPremium: true, icon: "🏷️",  apiProvider: "openai",     creditsPerUse: 5 },

  // AI SEO
  { id: "ai-keyword-research",    name: "AI Keyword Research",          description: "Discover high-value keywords with AI-powered analysis",            category: "ai-seo",      isPremium: true, icon: "🔍",  apiProvider: "dataforseo", creditsPerUse: 5 },
  { id: "ai-rank-tracker",        name: "AI Rank Tracker",              description: "Track keyword rankings across Google with weekly reports",         category: "ai-seo",      isPremium: true, icon: "📈",  apiProvider: "dataforseo", creditsPerUse: 3 },
  { id: "ai-backlink-checker",    name: "AI Backlink Checker",          description: "Analyze backlink profiles and find link opportunities",            category: "ai-seo",      isPremium: true, icon: "🔗",  apiProvider: "moz",        creditsPerUse: 5 },
  { id: "ai-content-brief",       name: "AI SEO Content Brief",         description: "Generate comprehensive content briefs for any target keyword",    category: "ai-seo",      isPremium: true, icon: "📋",  apiProvider: "dataforseo", creditsPerUse: 5 },
  { id: "ai-competitor-analysis", name: "AI Competitor Analysis",       description: "Analyze competitors' SEO strategy and content gaps",              category: "ai-seo",      isPremium: true, icon: "🔭",  apiProvider: "serpapi",    creditsPerUse: 8 },
  { id: "ai-email-subject",       name: "AI Email Subject Line Tester", description: "Score and optimize email subject lines for maximum open rates",   category: "ai-seo",      isPremium: true, icon: "📧",  apiProvider: "openai",     creditsPerUse: 1 },
  { id: "ai-ab-copy",             name: "AI A/B Copy Generator",        description: "Generate multiple copy variations for A/B testing",               category: "ai-seo",      isPremium: true, icon: "⚖️",  apiProvider: "openai",     creditsPerUse: 2 },

  // AI Chatbot
  { id: "ai-chatbot-builder",     name: "AI Chatbot Builder",           description: "Build a custom chatbot trained on your documents or website",     category: "ai-chatbot",  isPremium: true, icon: "🤖",  apiProvider: "openai",     creditsPerUse: 10 },
  { id: "ai-support-bot",         name: "AI Customer Support Bot",      description: "Deploy an AI support bot that answers customer questions 24/7",   category: "ai-chatbot",  isPremium: true, icon: "💬",  apiProvider: "openai",     creditsPerUse: 10 },
  { id: "ai-faq-chatbot",         name: "AI FAQ Chatbot",               description: "Create a FAQ chatbot from any URL or PDF in minutes",             category: "ai-chatbot",  isPremium: true, icon: "❓",  apiProvider: "openai",     creditsPerUse: 8 },
  { id: "ai-slack-bot",           name: "AI Slack Bot Builder",         description: "Build no-code AI bots for Slack and Discord workspaces",          category: "ai-chatbot",  isPremium: true, icon: "🤖",  apiProvider: "openai",     creditsPerUse: 10 },

  // AI Business
  { id: "ai-csv-analyzer",        name: "AI CSV Data Analyzer",         description: "Chat with your CSV data and get instant AI-powered insights",    category: "ai-business", isPremium: true, icon: "📊",  apiProvider: "openai",     creditsPerUse: 4 },
  { id: "ai-report-generator",    name: "AI Report Generator",          description: "Generate professional reports from raw data with AI",             category: "ai-business", isPremium: true, icon: "📄",  apiProvider: "openai",     creditsPerUse: 5 },
  { id: "ai-mrr-dashboard",       name: "AI MRR / Churn Dashboard",     description: "Connect Stripe and get AI-powered revenue analytics",            category: "ai-business", isPremium: true, icon: "📈",  apiProvider: "stripe",     creditsPerUse: 3 },
  { id: "ai-revenue-analytics",   name: "AI Revenue Analytics",         description: "Deep-dive analytics for Stripe subscriptions and revenue",        category: "ai-business", isPremium: true, icon: "💰",  apiProvider: "stripe",     creditsPerUse: 3 },
  { id: "ai-social-scheduler",    name: "AI Social Media Scheduler",    description: "Schedule AI-generated posts across Twitter, LinkedIn, Instagram", category: "ai-business", isPremium: true, icon: "📅",  apiProvider: "openai",     creditsPerUse: 2 },
  { id: "ai-caption-generator",   name: "AI Social Caption Generator",  description: "Generate captions for any image optimized per social platform",  category: "ai-business", isPremium: true, icon: "💬",  apiProvider: "openai",     creditsPerUse: 1 },
  { id: "ai-task-prioritizer",    name: "AI Task Prioritizer",          description: "Paste your task list and AI ranks them by impact and urgency",   category: "ai-business", isPremium: true, icon: "✅",  apiProvider: "openai",     creditsPerUse: 1 },

  // AI Email & Outreach
  { id: "ai-email-warmup",        name: "AI Email Warm-up",             description: "Warm up your email domain for better deliverability",             category: "ai-email",    isPremium: true, icon: "🌡️",  apiProvider: "sendgrid",   creditsPerUse: 5 },
  { id: "ai-email-sequence",      name: "AI Email Sequence Builder",    description: "Build complete email drip sequences with AI",                     category: "ai-email",    isPremium: true, icon: "📨",  apiProvider: "openai",     creditsPerUse: 4 },
  { id: "ai-outreach-generator",  name: "AI Outreach Generator",        description: "Generate hyper-personalized cold outreach at scale",              category: "ai-email",    isPremium: true, icon: "🎯",  apiProvider: "openai",     creditsPerUse: 2 },

  // AI Language
  { id: "ai-translator",          name: "AI Translator",                description: "Translate text between 100+ languages with DeepL quality",        category: "ai-language", isPremium: true, icon: "🌍",  apiProvider: "deepl",      creditsPerUse: 1 },
  { id: "ai-language-detector",   name: "AI Language Detector",         description: "Detect the language of any text instantly",                       category: "ai-language", isPremium: true, icon: "🔍",  apiProvider: "openai",     creditsPerUse: 1 },
  { id: "ai-sentiment-analyzer",  name: "AI Sentiment Analyzer",        description: "Analyze sentiment, tone and emotion in any text",                 category: "ai-language", isPremium: true, icon: "😊",  apiProvider: "openai",     creditsPerUse: 1 },
];

// ─── Combined registry ────────────────────────────────────────────────────────

export const ALL_TOOLS: Tool[] = [...FREE_TOOLS, ...AI_TOOLS];

export function getToolById(id: string): Tool | undefined {
  return ALL_TOOLS.find((t) => t.id === id);
}

export function getToolsByCategory(category: ToolCategory): Tool[] {
  return ALL_TOOLS.filter((t) => t.category === category);
}

export function getFreeTools(): Tool[] {
  return FREE_TOOLS;
}

export function getPremiumTools(): Tool[] {
  return AI_TOOLS;
}

export const CATEGORY_META: Record<string, { label: string; description: string; icon: string }> = {
  pdf:          { label: "PDF Tools",         description: "Merge, split, compress, convert and edit PDF files",          icon: "📄" },
  image:        { label: "Image Tools",       description: "Compress, resize, convert and edit images online",            icon: "🖼️" },
  audio:        { label: "Audio Tools",       description: "Convert audio formats and add protective watermarks",         icon: "🎵" },
  developer:    { label: "Developer Tools",   description: "JSON, regex, hash, JWT, base64 and more dev utilities",       icon: "💻" },
  seo:          { label: "SEO Tools",         description: "Meta tags, sitemaps, schema, robots.txt and more",            icon: "🌐" },
  writing:      { label: "Writing Tools",     description: "Case converter, slug generator, password generator and more", icon: "📝" },
  calculator:   { label: "Calculators",       description: "BMI, loan, mortgage, GST, ROI and more calculators",         icon: "🧮" },
  design:       { label: "Design Tools",      description: "CSS generators for gradients, shadows, grids and more",      icon: "🎨" },
  "ai-content": { label: "AI Writing",        description: "AI-powered blog writer, email generator, content repurposer", icon: "✍️" },
  "ai-audio":   { label: "AI Audio & Video",  description: "Transcription, text-to-speech, subtitle generation",         icon: "🎙️" },
  "ai-image":   { label: "AI Image Tools",    description: "Background removal, image generation, upscaling and more",   icon: "🎨" },
  "ai-seo":     { label: "AI SEO",            description: "Keyword research, rank tracking, backlink analysis",          icon: "🔍" },
  "ai-chatbot": { label: "AI Chatbots",       description: "Build custom chatbots trained on your content",              icon: "🤖" },
  "ai-business":{ label: "AI Business",       description: "Revenue analytics, social scheduler, data analysis",         icon: "📊" },
  "ai-email":   { label: "AI Email",          description: "Email warm-up, sequences and personalized outreach",         icon: "📧" },
  "ai-language":{ label: "AI Language",       description: "Translation, language detection and sentiment analysis",     icon: "🌍" },
};
