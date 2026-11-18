import { NextResponse } from "next/server";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { adminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

interface LsPayload {
  meta: { event_name: string; custom_data?: { user_id?: string } | null; test_mode?: boolean };
  data: { type: string; id: string; attributes: Record<string, unknown> };
}

function validSignature(raw: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const digest = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(digest, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

const str = (v: unknown) => (v === null || v === undefined ? null : String(v));

function isLifetimeOrder(attrs: Record<string, unknown>): boolean {
  const item = (attrs.first_order_item ?? {}) as Record<string, unknown>;
  const lifetimeVariant = process.env.LEMONSQUEEZY_LIFETIME_VARIANT_ID;
  if (lifetimeVariant) return str(item.variant_id) === lifetimeVariant;
  return /lifetime/i.test(`${item.product_name ?? ""} ${item.variant_name ?? ""}`);
}

export async function POST(req: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });

  const raw = await req.text();
  if (!validSignature(raw, req.headers.get("x-signature"), secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: LsPayload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { meta, data } = payload;
  const attrs = data?.attributes ?? {};
  const db = adminClient();

  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  if (storeId && str(attrs.store_id) !== storeId) {
    return NextResponse.json({ ok: true, ignored: "other store" });
  }

  // Idempotency: the same delivery is processed once.
  const eventId = createHash("sha256").update(raw).digest("hex");
  const { error: logError } = await db
    .from("webhook_events")
    .insert({ id: eventId, event_name: meta.event_name, payload } as never);
  if (logError?.code === "23505") return NextResponse.json({ ok: true, duplicate: true });
  if (logError) console.error("webhook log failed", logError.message);

  let row: Record<string, unknown> | null = null;

  if (data.type === "subscriptions") {
    const urls = (attrs.urls ?? {}) as Record<string, unknown>;
    row = {
      ls_id: `sub_${data.id}`,
      kind: "subscription",
      plan_name: str(attrs.variant_name) ?? str(attrs.product_name),
      status: str(attrs.status) ?? "unknown",
      ls_customer_id: str(attrs.customer_id),
      variant_id: str(attrs.variant_id),
      renews_at: str(attrs.renews_at),
      ends_at: str(attrs.ends_at),
      customer_portal_url: str(urls.customer_portal),
      update_payment_url: str(urls.update_payment_method),
      updated_at: str(attrs.updated_at) ?? new Date().toISOString(),
    };
  } else if (data.type === "orders" && isLifetimeOrder(attrs)) {
    const item = (attrs.first_order_item ?? {}) as Record<string, unknown>;
    const refunded = meta.event_name === "order_refunded" || attrs.refunded === true || attrs.status === "refunded";
    row = {
      ls_id: `order_${data.id}`,
      kind: "lifetime",
      plan_name: str(item.variant_name) ?? "Lifetime",
      status: refunded ? "refunded" : str(attrs.status) ?? "paid",
      ls_customer_id: str(attrs.customer_id),
      variant_id: str(item.variant_id),
      renews_at: null,
      ends_at: null,
      customer_portal_url: null,
      update_payment_url: null,
      updated_at: str(attrs.updated_at) ?? new Date().toISOString(),
    };
  }

  if (!row) return NextResponse.json({ ok: true, ignored: meta.event_name });

  const { data: existing } = await db
    .from("subscriptions")
    .select("user_id, updated_at")
    .eq("ls_id", row.ls_id as string)
    .maybeSingle<{ user_id: string; updated_at: string }>();

  // Ignore events older than what we already stored (deliveries can arrive out of order).
  if (existing && new Date(existing.updated_at) > new Date(row.updated_at as string)) {
    return NextResponse.json({ ok: true, ignored: "stale" });
  }

  const userId = meta.custom_data?.user_id || existing?.user_id;
  if (!userId) {
    console.error("Lemon Squeezy webhook without user_id", meta.event_name, data.id);
    return NextResponse.json({ ok: true, ignored: "no user_id" });
  }

  const { error } = await db.from("subscriptions").upsert({ ...row, user_id: userId } as never, { onConflict: "ls_id" });
  if (error) {
    console.error("subscription upsert failed", error.message);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
