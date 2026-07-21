// OpenAI provider — the single place that talks to an AI API. Every AI tool
// dispatch case in route.ts goes through generateText()/generateImage()
// here rather than calling the SDK directly, so there's one spot to check
// configuration, handle provider errors consistently, and (later) swap in
// other providers per tool.
//
// Gated entirely on OPENAI_API_KEY being set — with no key, every AI tool
// fails with a clear "not configured" error instead of a silent fake
// success. This module has not been exercised against a live OpenAI account
// (no key was available while building it); it follows the documented API
// contract via the official SDK, but treat the very first real call as the
// integration test.

export class AiNotConfiguredError extends Error {
  constructor() {
    super("AI provider is not configured on this deployment. Add OPENAI_API_KEY to enable this tool.");
    this.name = "AiNotConfiguredError";
  }
}

export function isOpenAiConfigured(): boolean {
  const key = process.env.OPENAI_API_KEY;
  return !!key && key !== "" && !key.startsWith("sk-...");
}

let _client: import("openai").default | null = null;

async function getClient() {
  if (!isOpenAiConfigured()) throw new AiNotConfiguredError();
  if (_client) return _client;
  const { default: OpenAI } = await import("openai");
  _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

export interface GenerateTextOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  opts: GenerateTextOptions = {}
): Promise<string> {
  const client = await getClient();
  const completion = await client.chat.completions.create({
    model: opts.model ?? "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: opts.maxTokens ?? 1200,
    temperature: opts.temperature ?? 0.7,
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error("The AI provider returned an empty response");
  return text;
}

export async function generateImageUrl(prompt: string, opts: { size?: "1024x1024" | "1792x1024" | "1024x1792" } = {}): Promise<string> {
  const client = await getClient();
  const result = await client.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: opts.size ?? "1024x1024",
  });

  const url = result.data?.[0]?.url;
  if (!url) throw new Error("The AI provider returned no image");
  return url;
}
