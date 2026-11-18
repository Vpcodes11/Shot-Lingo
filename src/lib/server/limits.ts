import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/supabase/env";

// Fallback limiter for local development without Supabase.
const buckets = new Map<string, { count: number; reset: number }>();
function memoryLimit(id: string, limit: number): boolean {
  const now = Date.now();
  const b = buckets.get(id);
  if (!b || b.reset < now) {
    buckets.set(id, { count: 1, reset: now + 24 * 60 * 60 * 1000 });
    return true;
  }
  if (b.count >= limit) return false;
  b.count++;
  return true;
}

/** Counts one use of `key` today. Returns false once the daily limit is exceeded. */
export async function allowDaily(key: string, limit: number): Promise<boolean> {
  if (!supabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return memoryLimit(key, limit);
  const { data, error } = await adminClient().rpc("bump_usage", { p_key: key, p_limit: limit } as never);
  if (error) {
    console.error("bump_usage failed", error.message);
    return memoryLimit(key, limit);
  }
  return data === true;
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0].trim() : req.headers.get("x-real-ip")) || "unknown";
}
