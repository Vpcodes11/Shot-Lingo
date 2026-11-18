import "server-only";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";

export type PlanId = "monthly" | "yearly" | "lifetime";

export interface SubscriptionRow {
  ls_id: string;
  kind: "subscription" | "lifetime";
  plan_name: string | null;
  status: string;
  renews_at: string | null;
  ends_at: string | null;
  customer_portal_url: string | null;
  update_payment_url: string | null;
  updated_at: string;
}

export interface Viewer {
  user: { id: string; email: string } | null;
  pro: boolean;
  active: SubscriptionRow | null; // the row that grants Pro, if any
}

/** Does this row currently grant Pro access? */
export function grantsPro(row: SubscriptionRow, now = new Date()): boolean {
  if (row.kind === "lifetime") return row.status === "paid";
  if (["active", "on_trial", "past_due"].includes(row.status)) return true;
  // Cancelled subscriptions stay Pro until the end of the paid period.
  if (row.status === "cancelled" && row.ends_at) return new Date(row.ends_at) > now;
  return false;
}

function compEmails(): string[] {
  return (process.env.PRO_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function getViewer(): Promise<Viewer> {
  if (!supabaseConfigured()) return { user: null, pro: false, active: null };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const u = data.user;
  if (!u) return { user: null, pro: false, active: null };
  const user = { id: u.id, email: u.email ?? "" };

  const { data: rows } = await supabase
    .from("subscriptions")
    .select("ls_id, kind, plan_name, status, renews_at, ends_at, customer_portal_url, update_payment_url, updated_at")
    .order("updated_at", { ascending: false });
  const list = (rows ?? []) as SubscriptionRow[];
  const active = list.find((r) => grantsPro(r)) ?? null;
  const pro = !!active || compEmails().includes(user.email.toLowerCase());
  return { user, pro, active: active ?? list[0] ?? null };
}

const CHECKOUT_ENV: Record<PlanId, string | undefined> = {
  monthly: process.env.LEMONSQUEEZY_CHECKOUT_MONTHLY_URL,
  yearly: process.env.LEMONSQUEEZY_CHECKOUT_YEARLY_URL,
  lifetime: process.env.LEMONSQUEEZY_CHECKOUT_LIFETIME_URL,
};

/** Lemon Squeezy checkout link, pre-filled with the user's email and tagged with their id for the webhook. */
export function checkoutUrl(plan: PlanId, user: { id: string; email: string }): string | null {
  const base = CHECKOUT_ENV[plan];
  if (!base) return null;
  const url = new URL(base);
  url.searchParams.set("checkout[email]", user.email);
  url.searchParams.set("checkout[custom][user_id]", user.id);
  return url.toString();
}
