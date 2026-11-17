import { NextResponse } from "next/server";
import * as z from "zod/v4";
import { AiError, translateCaptions } from "@/lib/server/ai";
import { isProLicense, rateLimit } from "@/lib/server/license";
import { langByCode } from "@/lib/languages";

export const runtime = "nodejs";
export const maxDuration = 60;

const Caption = z.object({ headline: z.string().max(200), subheadline: z.string().max(300) });
const Body = z.object({
  appName: z.string().max(80).default(""),
  sourceLang: z.string().max(10).default("en"),
  targetLangs: z.array(z.string().max(10)).min(1).max(8),
  captions: z.array(Caption).min(1).max(10),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const key = req.headers.get("x-license-key");
  if (!(await isProLicense(key))) {
    return NextResponse.json({ error: "AI translation is a Pro feature." }, { status: 402 });
  }
  if (!rateLimit(`tr:key:${key}`, 200, 24 * 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Daily translation limit reached. Try again tomorrow." }, { status: 429 });
  }

  const { appName, sourceLang, captions } = parsed.data;
  const targetLangs = parsed.data.targetLangs.map((c) => ({ code: c, name: langByCode(c).name }));
  try {
    const translations = await translateCaptions({ appName, sourceLang: langByCode(sourceLang).name, targetLangs, captions });
    return NextResponse.json({ translations });
  } catch (err) {
    if (err instanceof AiError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
