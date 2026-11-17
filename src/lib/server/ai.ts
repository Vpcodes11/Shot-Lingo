import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import * as z from "zod/v4";

export const MODEL = process.env.AI_MODEL || "claude-opus-5-5";

export class AiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new AiError("AI is not configured on this server (missing ANTHROPIC_API_KEY).", 503);
  client ??= new Anthropic();
  return client;
}

const CaptionSchema = z.object({ headline: z.string(), subheadline: z.string() });

export async function structured<T extends z.ZodType>(opts: {
  system: string;
  content: Anthropic.Beta.BetaContentBlockParam[];
  schema: T;
  maxTokens?: number;
}): Promise<z.infer<T>> {
  try {
    const response = await getClient().beta.messages.parse({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 8000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: opts.system,
      output_config: { effort: "low", format: betaZodOutputFormat(opts.schema) },
      messages: [{ role: "user", content: opts.content }],
    });
    if (response.stop_reason === "refusal") throw new AiError("The AI declined this request. Try different text.", 422);
    if (response.stop_reason === "max_tokens") throw new AiError("Response was too long. Try fewer screens or languages at once.", 422);
    if (!response.parsed_output) throw new AiError("The AI returned an unexpected response. Please retry.", 502);
    return response.parsed_output as z.infer<T>;
  } catch (err) {
    if (err instanceof AiError) throw err;
    if (err instanceof Anthropic.RateLimitError) throw new AiError("AI is busy right now. Try again in a minute.", 429);
    if (err instanceof Anthropic.AuthenticationError) throw new AiError("AI is misconfigured on this server.", 503);
    if (err instanceof Anthropic.APIError) throw new AiError(`AI error (${err.status ?? "network"}). Please retry.`, 502);
    throw err;
  }
}

const COPY_RULES = `Rules for every caption:
- headline: max 5 words (about 32 characters), benefit-led, punchy, title case not required. No emojis, no quotes, no trailing period.
- subheadline: one short supporting line, max 10 words. Plain and concrete.
- Never invent features you cannot see or infer from the description.
- Screens are shown in order on the store listing: the first caption sells the core value, the rest each highlight one distinct benefit.`;

export async function writeCaptions(input: {
  appName: string;
  appDescription: string;
  screens: { image?: string; notes?: string }[];
}) {
  const content: Anthropic.Beta.BetaContentBlockParam[] = [
    {
      type: "text",
      text: `App name: ${input.appName || "(not given)"}\nApp description: ${input.appDescription || "(not given)"}\n\nThere are ${input.screens.length} screenshots, in store order. Write one caption per screenshot.`,
    },
  ];
  input.screens.forEach((s, i) => {
    content.push({ type: "text", text: `Screenshot ${i + 1}${s.notes ? ` (maker's note: ${s.notes})` : ""}:` });
    if (s.image) content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: s.image } });
  });

  const schema = z.object({ captions: z.array(CaptionSchema) });
  const out = await structured({
    system: `You are a senior App Store Optimization copywriter. You write the marketing captions shown above app screenshots on the App Store and Google Play.\n${COPY_RULES}\nReturn exactly one caption per screenshot, in the same order.`,
    content,
    schema,
  });
  return out.captions.slice(0, input.screens.length);
}

export async function translateCaptions(input: {
  appName: string;
  sourceLang: string;
  targetLangs: { code: string; name: string }[];
  captions: { headline: string; subheadline: string }[];
}) {
  const schema = z.object({
    translations: z.array(z.object({ lang: z.string(), captions: z.array(CaptionSchema) })),
  });
  const out = await structured({
    system: `You localize App Store screenshot captions. Write like a native marketing copywriter in each target language, not a literal translator. Keep each headline about as short as the source (it must fit on a phone screenshot). Keep the app name "${input.appName}" and other brand names untranslated. Use the language's native script. Return every target language, each with exactly ${input.captions.length} captions in the same order.`,
    content: [
      {
        type: "text",
        text: `Source language: ${input.sourceLang}\nTarget languages (use these exact codes in "lang"): ${input.targetLangs.map((l) => `${l.code} = ${l.name}`).join(", ")}\n\nSource captions (JSON):\n${JSON.stringify(input.captions, null, 2)}`,
      },
    ],
    schema,
    maxTokens: 16000,
  });
  return out.translations;
}
