// Prompt templates for the text-generation AI tools. Each entry maps a
// tool id to a system prompt (the tool's "job description") and a function
// that turns the structured request body into the actual user message.
// route.ts's dispatch() looks a tool up here and calls generateText() —
// see src/lib/ai-provider.ts.

export interface AiPromptConfig {
  systemPrompt: string;
  buildUserPrompt: (body: Record<string, unknown>) => string;
  maxTokens?: number;
}

const str = (v: unknown, fallback = ""): string => (typeof v === "string" && v.trim() ? v.trim() : fallback);
const num = (v: unknown, fallback: number): number => (typeof v === "number" && Number.isFinite(v) ? v : fallback);

export const AI_PROMPT_TOOLS: Record<string, AiPromptConfig> = {
  "ai-blog-writer": {
    systemPrompt: "You are an expert SEO content writer. Write full, well-structured blog posts with headings, an engaging intro, and a clear conclusion. Use the target keywords naturally.",
    buildUserPrompt: (b) => `Write a blog post of about ${num(b.wordCount, 800)} words on: "${str(b.topic)}".\nKeywords to include: ${str(b.keywords, "none specified")}.\nTone: ${str(b.tone, "informative and engaging")}.`,
    maxTokens: 2000,
  },
  "ai-content-repurposer": {
    systemPrompt: "You repurpose long-form content into multiple short-form formats for social media and email, preserving the core message while adapting tone and length to each platform.",
    buildUserPrompt: (b) => `Repurpose this content into: ${Array.isArray(b.formats) ? (b.formats as string[]).join(", ") : "a tweet, a LinkedIn post, and a short email"}.\n\nOriginal content:\n${str(b.content)}`,
    maxTokens: 1500,
  },
  "ai-cold-email": {
    systemPrompt: "You write concise, personalized B2B cold emails that get replies — short, specific, no fluff, one clear call to action.",
    buildUserPrompt: (b) => `Write a cold email for this product/service: ${str(b.product)}.\nTarget audience: ${str(b.targetAudience, "not specified")}.\nPain point it solves: ${str(b.painPoint, "not specified")}.`,
  },
  "ai-product-description": {
    systemPrompt: "You write compelling, benefit-focused e-commerce product descriptions that convert browsers into buyers.",
    buildUserPrompt: (b) => `Write a product description for: ${str(b.productName)}.\nKey features: ${str(b.features, "not specified")}.\nTone: ${str(b.tone, "persuasive and warm")}.`,
  },
  "ai-job-description": {
    systemPrompt: "You write clear, inclusive, compelling job postings that attract strong candidates.",
    buildUserPrompt: (b) => `Write a job description for: ${str(b.jobTitle)} at ${str(b.company, "our company")}.\nKey responsibilities: ${str(b.responsibilities, "not specified")}.\nRequirements: ${str(b.requirements, "not specified")}.`,
    maxTokens: 1500,
  },
  "ai-ad-copy": {
    systemPrompt: "You write high-converting ad copy tailored to the platform's format and character constraints (headline + body + CTA).",
    buildUserPrompt: (b) => `Write ad copy for: ${str(b.product)}.\nPlatform: ${str(b.platform, "Google Ads")}.\nTone: ${str(b.tone, "punchy and direct")}. Provide 3 variations.`,
  },
  "ai-youtube-script": {
    systemPrompt: "You write engaging YouTube video scripts with a strong hook in the first 5 seconds, clear structure, and a call to action at the end.",
    buildUserPrompt: (b) => `Write a YouTube script about: "${str(b.topic)}".\nTarget duration: ${str(b.duration, "5-8 minutes")}.\nStyle: ${str(b.style, "conversational")}.`,
    maxTokens: 2000,
  },
  "ai-newsletter": {
    systemPrompt: "You write engaging email newsletters with a clear structure: subject line, intro, 2-3 sections, and a closing CTA.",
    buildUserPrompt: (b) => `Write a newsletter about: "${str(b.topic)}".\nAudience: ${str(b.audience, "general subscribers")}.\nTone: ${str(b.tone, "friendly and informative")}.`,
    maxTokens: 1500,
  },
  "ai-linkedin-post": {
    systemPrompt: "You write LinkedIn posts formatted for engagement: short punchy lines, line breaks, a hook first line, and a question or CTA at the end. No hashtag spam.",
    buildUserPrompt: (b) => `Write a LinkedIn post about: "${str(b.topic)}".\nTone: ${str(b.tone, "professional but personable")}.`,
  },
  "ai-twitter-thread": {
    systemPrompt: "You write Twitter/X threads: a strong hook tweet, then numbered tweets each under 280 characters, ending with a summary or CTA.",
    buildUserPrompt: (b) => `Write a Twitter thread of about ${num(b.tweetCount, 6)} tweets on: "${str(b.topic)}".`,
  },
  "ai-paraphraser": {
    systemPrompt: "You rewrite text to sound different while preserving the exact meaning. Match the requested style.",
    buildUserPrompt: (b) => `Rewrite this text in a ${str(b.style, "clearer, more concise")} style:\n\n${str(b.text)}`,
  },
  "ai-grammar-checker": {
    systemPrompt: "You are a meticulous copy editor. Fix grammar, spelling, and awkward phrasing while preserving the author's voice. Return only the corrected text.",
    buildUserPrompt: (b) => str(b.text),
  },
  "ai-summarizer": {
    systemPrompt: "You write clear, accurate summaries that preserve the key points and any numbers/facts from the source.",
    buildUserPrompt: (b) => `Summarize the following in about ${str(b.length, "3-5 sentences")}:\n\n${str(b.text)}`,
  },
  "ai-cover-letter": {
    systemPrompt: "You write tailored, specific cover letters that connect the candidate's background to the role — no generic filler.",
    buildUserPrompt: (b) => `Write a cover letter for the role: ${str(b.jobTitle)} at ${str(b.company, "the company")}.\nCandidate background: ${str(b.background, "not specified")}.`,
    maxTokens: 1200,
  },
  "ai-resume-reviewer": {
    systemPrompt: "You are an experienced technical recruiter. Give specific, actionable feedback on resumes: what's strong, what's weak, and concrete rewrites for the weakest bullet points.",
    buildUserPrompt: (b) => `Review this resume and give specific feedback:\n\n${str(b.resumeText)}`,
    maxTokens: 1500,
  },
  "ai-proposal-writer": {
    systemPrompt: "You write professional business proposals: overview, scope, timeline, and pricing structure placeholders where relevant.",
    buildUserPrompt: (b) => `Write a business proposal for project "${str(b.projectName)}" for client "${str(b.client, "the client")}".\nScope: ${str(b.scope, "not specified")}.`,
    maxTokens: 2000,
  },
  "ai-press-release": {
    systemPrompt: "You write press releases in standard AP style: headline, dateline, lead paragraph answering who/what/when/where/why, supporting quotes, and boilerplate.",
    buildUserPrompt: (b) => `Write a press release for this announcement: ${str(b.announcement)}.\nCompany: ${str(b.company, "the company")}.`,
    maxTokens: 1500,
  },
  "ai-faq-generator": {
    systemPrompt: "You generate comprehensive, genuinely useful FAQ sections that anticipate real user questions.",
    buildUserPrompt: (b) => `Generate ${num(b.count, 8)} FAQs with answers about: "${str(b.topic)}".`,
  },
  "ai-meta-description": {
    systemPrompt: "You write SEO meta descriptions: under 160 characters, compelling, includes the key topic, ends with an implicit or explicit reason to click.",
    buildUserPrompt: (b) => `Write 3 meta description options (each under 160 characters) for a page titled "${str(b.pageTitle)}".${b.pageContent ? `\nPage content summary: ${str(b.pageContent)}` : ""}`,
  },
  "ai-title-generator": {
    systemPrompt: "You write compelling, clickable titles/headlines that are honest (no clickbait that misleads).",
    buildUserPrompt: (b) => `Generate ${num(b.count, 8)} title options for content about: "${str(b.topic)}".`,
  },
  "ai-email-subject": {
    systemPrompt: "You are an email deliverability and copywriting expert. Score the given subject line (1-10) and explain why, then provide 3 improved alternatives.",
    buildUserPrompt: (b) => `Subject line to evaluate: "${str(b.subjectLine)}"${b.context ? `\nContext: ${str(b.context)}` : ""}`,
  },
  "ai-ab-copy": {
    systemPrompt: "You generate meaningfully different copy variations for A/B testing — vary the angle/hook, not just synonyms.",
    buildUserPrompt: (b) => `Generate ${num(b.variations, 4)} distinct variations of this copy:\n\n${str(b.original)}`,
  },
  "ai-caption-generator": {
    systemPrompt: "You write social media captions optimized for the specified platform's conventions (length, tone, hashtag usage).",
    buildUserPrompt: (b) => `Write a caption for ${str(b.platform, "Instagram")} for an image described as: "${str(b.description)}".`,
  },
  "ai-task-prioritizer": {
    systemPrompt: "You are a productivity expert. Rank the given tasks by impact and urgency (using a simple framework like Eisenhower matrix reasoning) and explain the ranking briefly.",
    buildUserPrompt: (b) => `Prioritize this task list:\n\n${str(b.tasks)}`,
  },
  "ai-email-sequence": {
    systemPrompt: "You write multi-email drip sequences: each email has a clear purpose, a subject line, and body copy, sequenced to build toward a goal.",
    buildUserPrompt: (b) => `Write a ${num(b.emailCount, 4)}-email drip sequence with this goal: ${str(b.goal)}.`,
    maxTokens: 2000,
  },
  "ai-outreach-generator": {
    systemPrompt: "You write hyper-personalized cold outreach messages that reference specific details about the prospect rather than generic templates.",
    buildUserPrompt: (b) => `Write a personalized outreach message for this prospect: ${str(b.prospect)}.\nContext/reason for reaching out: ${str(b.context, "not specified")}.`,
  },
  "ai-language-detector": {
    systemPrompt: "You detect the language of the given text. Respond with only the language name and ISO 639-1 code, e.g. \"English (en)\", nothing else.",
    buildUserPrompt: (b) => str(b.text),
    maxTokens: 50,
  },
  "ai-sentiment-analyzer": {
    systemPrompt: "You analyze the sentiment, tone, and emotion of text. Respond with: overall sentiment (positive/negative/neutral/mixed), a confidence-style summary, and 2-3 notable emotional cues from the text.",
    buildUserPrompt: (b) => str(b.text),
    maxTokens: 400,
  },
  "ai-csv-analyzer": {
    systemPrompt: "You analyze tabular data pasted as CSV/text and answer questions or surface insights (trends, outliers, totals) about it. Be specific and reference actual values from the data.",
    buildUserPrompt: (b) => `Data:\n${str(b.csvData)}\n\nQuestion/request: ${str(b.question, "Summarize the key insights in this data")}`,
    maxTokens: 1200,
  },
  "ai-report-generator": {
    systemPrompt: "You turn raw data and notes into a professional, well-structured report with a summary, key findings, and a conclusion.",
    buildUserPrompt: (b) => `Generate a report from this data/notes:\n\n${str(b.data)}`,
    maxTokens: 2000,
  },

  // These 5 describe infrastructure-heavy products (a hosted bot, a posting
  // scheduler) that a one-shot API call can't actually stand up — no chatbot
  // hosting, no Slack/Discord install, no social platform OAuth exists here.
  // Scoped down to what a text-generation call can honestly deliver: a
  // ready-to-use script/persona/calendar the user pastes into their own bot
  // platform or scheduler, rather than a fake "success" that does nothing.
  "ai-chatbot-builder": {
    systemPrompt: "You design chatbot personas and conversation flows. Given a description of a business, product, or website, produce: a bot persona (name, tone, scope of what it should/shouldn't answer), 6-8 sample Q&A pairs it should handle, and a clear rule for when to hand off to a human.",
    buildUserPrompt: (b) => `Design a chatbot for: ${str(b.purpose)}.\nTone: ${str(b.tone, "friendly and professional")}.`,
    maxTokens: 1200,
  },
  "ai-support-bot": {
    systemPrompt: "You design customer support bot scripts. Given a product/service description, produce: a greeting, 6-8 common Q&A pairs with answers, tone guidelines, and clear escalation criteria for handing off to a human agent.",
    buildUserPrompt: (b) => `Design a customer support bot for: ${str(b.product)}.\nCommon issues to cover: ${str(b.commonIssues, "not specified")}.`,
    maxTokens: 1200,
  },
  "ai-faq-chatbot": {
    systemPrompt: "You convert reference content (site text, docs, FAQ pages) into a structured FAQ chatbot script: a list of intents, each with 2-3 example user phrasings and the bot's response, ready to paste into a chatbot platform.",
    buildUserPrompt: (b) => `Build an FAQ chatbot script from this content:\n\n${str(b.content)}`,
    maxTokens: 1500,
  },
  "ai-slack-bot": {
    systemPrompt: "You design no-code bot personas and command scripts for Slack and Discord workspaces. Given a description of what the bot should do, produce: a bot persona, 4-6 example slash-commands with sample responses, and a short setup note for wiring it into the platform.",
    buildUserPrompt: (b) => `Design a ${str(b.platform, "Slack")} bot for: ${str(b.purpose)}.`,
    maxTokens: 1000,
  },
  "ai-social-scheduler": {
    systemPrompt: "You are a social media content planner. Given a goal/topic and target platforms, generate a content calendar: for each post, the platform, a suggested day/time, and full draft copy tailored to that platform's conventions.",
    buildUserPrompt: (b) => `Create a ${num(b.count, 7)}-post social media content calendar about: "${str(b.topic)}".\nPlatforms: ${str(b.platforms, "Twitter, LinkedIn, Instagram")}.`,
    maxTokens: 1800,
  },
};
