import { requireApiUser } from "@/lib/api-auth";
import { runPublishTick } from "@/lib/queue/scheduler";
import { runMetricSync } from "@/lib/queue/maintenance";
import { rateLimit } from "@/lib/rate-limit";
import { handleError, ok, tooMany } from "@/lib/http";

export const runtime = "nodejs";

/** Authenticated manual trigger used by the Signal Queue "run now" control. */
export async function POST() {
  try {
    const user = await requireApiUser();
    const gate = rateLimit(`worker:${user.id}`, 6, 60_000);
    if (!gate.ok) return tooMany(gate.retryAfterSeconds);

    const report = await runPublishTick(new Date());
    await runMetricSync([user.id]);
    return ok(report);
  } catch (err) {
    return handleError(err);
  }
}
