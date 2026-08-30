import { env } from "@/lib/env";

/**
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when the env var is
 * set. In demo mode (no secret) we allow the call so the worker can be poked
 * from the dashboard, but never in production without a secret.
 */
export function authorizeCron(request: Request): { ok: boolean; reason?: string } {
  if (!env.cronSecret) {
    if (env.nodeEnv === "production") {
      return { ok: false, reason: "CRON_SECRET is required in production" };
    }
    return { ok: true };
  }
  const header = request.headers.get("authorization");
  if (header === `Bearer ${env.cronSecret}`) return { ok: true };

  const url = new URL(request.url);
  if (url.searchParams.get("key") === env.cronSecret) return { ok: true };

  return { ok: false, reason: "Bad or missing cron secret" };
}
