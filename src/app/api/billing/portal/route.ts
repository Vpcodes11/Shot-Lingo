import { NextResponse } from "next/server";
import { getViewer } from "@/lib/server/billing";
import { BILLING_PORTAL } from "@/lib/site";

export const dynamic = "force-dynamic";

// Sends the customer to Lemon Squeezy's portal (cancel, change card, invoices).
export async function GET(request: Request) {
  const viewer = await getViewer();
  if (!viewer.user) return NextResponse.redirect(new URL("/login?next=/account", request.url));

  const sub = viewer.active;
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (sub?.kind === "subscription" && apiKey) {
    try {
      const res = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${sub.ls_id.replace(/^sub_/, "")}`, {
        headers: { Accept: "application/vnd.api+json", Authorization: `Bearer ${apiKey}` },
        cache: "no-store",
      });
      if (res.ok) {
        const json = (await res.json()) as { data?: { attributes?: { urls?: { customer_portal?: string } } } };
        const fresh = json.data?.attributes?.urls?.customer_portal;
        if (fresh) return NextResponse.redirect(fresh);
      }
    } catch (e) {
      console.error("portal lookup failed", e);
    }
  }
  return NextResponse.redirect(sub?.customer_portal_url || BILLING_PORTAL);
}
