import { NextResponse } from "next/server";
import { clientIp, isProLicense, rateLimit } from "@/lib/server/license";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!rateLimit(`lic:ip:${clientIp(req)}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
  const body = (await req.json().catch(() => null)) as { licenseKey?: unknown } | null;
  const key = typeof body?.licenseKey === "string" ? body.licenseKey : "";
  const pro = await isProLicense(key);
  return NextResponse.json({ pro });
}
