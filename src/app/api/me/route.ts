import { NextResponse } from "next/server";
import { getViewer } from "@/lib/server/billing";

export const dynamic = "force-dynamic";

export async function GET() {
  const v = await getViewer();
  return NextResponse.json(
    { user: v.user ? { email: v.user.email } : null, pro: v.pro },
    { headers: { "Cache-Control": "no-store" } },
  );
}
