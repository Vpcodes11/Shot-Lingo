import { NextResponse } from "next/server";
import * as z from "zod/v4";
import { AiError, writeCaptions } from "@/lib/server/ai";
import { clientIp, isProLicense, rateLimit } from "@/lib/server/license";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  appName: z.string().max(80).default(""),
  appDescription: z.string().max(1500).default(""),
  screens: z
    .array(z.object({ image: z.string().max(400_000).optional(), notes: z.string().max(200).optional() }))
    .min(1)
    .max(10),
});

const DAY = 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const key = req.headers.get("x-license-key");
  const pro = await isProLicense(key);
  const allowed = pro ? rateLimit(`cap:key:${key}`, 300, DAY) : rateLimit(`cap:ip:${clientIp(req)}`, 5, DAY);
  if (!allowed) {
    return NextResponse.json(
      { error: pro ? "Daily AI limit reached. Try again tomorrow." : "Free AI captions used up for today. Upgrade to Pro for unlimited." },
      { status: 429 },
    );
  }
  if (!pro && parsed.data.screens.length > 3) {
    return NextResponse.json({ error: "Free plan supports 3 screens. Upgrade to Pro for 10." }, { status: 402 });
  }

  try {
    const captions = await writeCaptions(parsed.data);
    return NextResponse.json({ captions });
  } catch (err) {
    if (err instanceof AiError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
