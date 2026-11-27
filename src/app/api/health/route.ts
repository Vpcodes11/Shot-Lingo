import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

/**
 * Launch checklist for the running deployment.
 *   GET /api/health                  -> { ok, database }  (public, for uptime monitors)
 *   GET /api/health?key=<HEALTH_KEY> -> every setting, present / missing (never the values)
 */
export async function GET(req: Request) {
  let database = false;
  if (supabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { error } = await adminClient().from("webhook_events").select("id", { head: true, count: "exact" });
    database = !error;
    if (error) console.error("health: database", error.message);
  }

  const key = new URL(req.url).searchParams.get("key");
  const secret = process.env.HEALTH_KEY;
  if (!secret || key !== secret) {
    return NextResponse.json({ ok: database, database }, { status: database ? 200 : 503, headers: { "Cache-Control": "no-store" } });
  }

  const has = (n: string) => Boolean(process.env[n]);
  const site = process.env.NEXT_PUBLIC_SITE_URL || "";
  const checks: Record<string, { ok: boolean; note?: string }> = {
    database: { ok: database, note: "Supabase reachable and migration applied" },
    NEXT_PUBLIC_SITE_URL: { ok: site.startsWith("https://") },
    NEXT_PUBLIC_SUPPORT_EMAIL: { ok: has("NEXT_PUBLIC_SUPPORT_EMAIL") },
    NEXT_PUBLIC_SUPABASE_URL: { ok: has("NEXT_PUBLIC_SUPABASE_URL") },
    NEXT_PUBLIC_SUPABASE_ANON_KEY: { ok: has("NEXT_PUBLIC_SUPABASE_ANON_KEY") },
    SUPABASE_SERVICE_ROLE_KEY: { ok: has("SUPABASE_SERVICE_ROLE_KEY") },
    ANTHROPIC_API_KEY: { ok: has("ANTHROPIC_API_KEY"), note: `Model: ${process.env.AI_MODEL || "claude-opus-5-5 (default)"}` },
    LEMONSQUEEZY_CHECKOUT_MONTHLY_URL: { ok: has("LEMONSQUEEZY_CHECKOUT_MONTHLY_URL") },
    LEMONSQUEEZY_CHECKOUT_YEARLY_URL: { ok: has("LEMONSQUEEZY_CHECKOUT_YEARLY_URL") },
    LEMONSQUEEZY_CHECKOUT_LIFETIME_URL: { ok: has("LEMONSQUEEZY_CHECKOUT_LIFETIME_URL") },
    LEMONSQUEEZY_STORE_ID: { ok: has("LEMONSQUEEZY_STORE_ID") },
    LEMONSQUEEZY_WEBHOOK_SECRET: { ok: has("LEMONSQUEEZY_WEBHOOK_SECRET") },
    LEMONSQUEEZY_LIFETIME_VARIANT_ID: { ok: has("LEMONSQUEEZY_LIFETIME_VARIANT_ID") },
  };
  return NextResponse.json({ ready: Object.values(checks).every((c) => c.ok), checks }, { headers: { "Cache-Control": "no-store" } });
}
