import { NextResponse } from "next/server";
import { checkoutUrl, getViewer, type PlanId } from "@/lib/server/billing";

export const dynamic = "force-dynamic";

const PLANS: PlanId[] = ["monthly", "yearly", "lifetime"];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const plan = url.searchParams.get("plan") as PlanId;
  if (!PLANS.includes(plan)) return NextResponse.redirect(new URL("/#pricing", request.url));

  const viewer = await getViewer();
  if (!viewer.user) {
    const next = `/api/checkout?plan=${plan}`;
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}&reason=upgrade`, request.url));
  }
  if (viewer.pro) return NextResponse.redirect(new URL("/account", request.url));

  const target = checkoutUrl(plan, viewer.user);
  if (!target) return NextResponse.redirect(new URL("/account?error=checkout", request.url));
  return NextResponse.redirect(target);
}
