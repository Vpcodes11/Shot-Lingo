import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

let admin: ReturnType<typeof createClient> | null = null;

// Service-role client: bypasses row level security. Server-only, never send to the browser.
export function adminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !key) throw new Error("Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  admin ??= createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}
