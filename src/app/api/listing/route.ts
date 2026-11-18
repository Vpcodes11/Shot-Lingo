import { NextResponse } from "next/server";
import * as z from "zod/v4";
import { AiError, writeListings } from "@/lib/server/ai";
import { allowDaily } from "@/lib/server/limits";
import { getViewer } from "@/lib/server/billing";
import { langByCode } from "@/lib/languages";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  appName: z.string().max(80).default(""),
  appDescription: z.string().max(1500).default(""),
  captions: z.array(z.object({ headline: z.string().max(200), subheadline: z.string().max(300) })).max(10).default([]),
  langs: z.array(z.string().max(10)).min(1).max(2),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const viewer = await getViewer();
  if (!viewer.pro) {
    return NextResponse.json({ error: "Store listing text is a Pro feature." }, { status: 402 });
  }
  if (!(await allowDaily(`ls:user:${viewer.user!.id}`, 150))) {
    return NextResponse.json({ error: "Daily listing limit reached. Try again tomorrow." }, { status: 429 });
  }
  if (!parsed.data.appDescription.trim() && !parsed.data.captions.some((c) => c.headline.trim())) {
    return NextResponse.json({ error: "Describe your app or write captions first." }, { status: 400 });
  }

  try {
    const listings = await writeListings({
      ...parsed.data,
      langs: parsed.data.langs.map((c) => ({ code: c, name: langByCode(c).name })),
    });
    return NextResponse.json({ listings });
  } catch (err) {
    if (err instanceof AiError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
