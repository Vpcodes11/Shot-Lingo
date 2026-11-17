import "server-only";

// License check against Lemon Squeezy's public License API (no secret needed).
// Manual keys (for friends, testers, lifetime deals sold elsewhere) can be
// listed in PRO_LICENSE_KEYS, comma-separated.

const cache = new Map<string, { valid: boolean; expires: number }>();
const TTL = 10 * 60 * 1000;

export async function isProLicense(rawKey: string | null | undefined): Promise<boolean> {
  const key = (rawKey || "").trim();
  if (!key || key.length > 200) return false;

  const manual = (process.env.PRO_LICENSE_KEYS || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  if (manual.includes(key)) return true;

  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.valid;

  let valid = false;
  try {
    const res = await fetch("https://api.lemonsqueezy.com/v1/licenses/validate", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ license_key: key }),
      cache: "no-store",
    });
    const data = (await res.json()) as { valid?: boolean; meta?: { store_id?: number } };
    const storeId = process.env.LEMONSQUEEZY_STORE_ID;
    valid = !!data.valid && (!storeId || String(data.meta?.store_id) === storeId);
  } catch {
    valid = false;
  }
  cache.set(key, { valid, expires: Date.now() + TTL });
  return valid;
}

// Best-effort in-memory rate limiter. Per server instance; good enough to stop
// casual abuse of the free AI tier. Swap for Upstash/Redis when traffic grows.
const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(id: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(id);
  if (!b || b.reset < now) {
    buckets.set(id, { count: 1, reset: now + windowMs });
    if (buckets.size > 50_000) buckets.clear();
    return true;
  }
  if (b.count >= limit) return false;
  b.count++;
  return true;
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0] : req.headers.get("x-real-ip")) || "unknown";
}
