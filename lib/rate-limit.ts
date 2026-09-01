interface Bucket {
  count: number;
  resetAt: number;
}

const globalForRl = globalThis as unknown as { _aetheriaRateLimit?: Map<string, Bucket> };
const store = globalForRl._aetheriaRateLimit ?? new Map<string, Bucket>();
globalForRl._aetheriaRateLimit = store;

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Fixed-window in-memory rate limiter. Scoped to one serverless instance, which
 * is enough to blunt brute force and runaway loops. For a hardened multi-region
 * deployment, back this with Upstash Redis (@upstash/ratelimit).
 */
export function rateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  if (store.size > 5000) {
    for (const [k, b] of store) if (b.resetAt <= now) store.delete(k);
  }

  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > max) {
    return { ok: false, remaining: 0, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true, remaining: Math.max(0, max - bucket.count), retryAfterSeconds: 0 };
}

/** Test helper. */
export function resetRateLimit() {
  store.clear();
}

/** Best-effort client IP for anonymous rate limiting. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "0.0.0.0";
}
