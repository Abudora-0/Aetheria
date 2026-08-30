import { requireApiUser } from "@/lib/api-auth";
import { runPublishTick } from "@/lib/queue/scheduler";
import { runMetricSync } from "@/lib/queue/maintenance";
import { handleError, ok } from "@/lib/http";

export const runtime = "nodejs";

/** Authenticated manual trigger used by the Signal Queue "run now" control. */
export async function POST() {
  try {
    const user = await requireApiUser();
    const report = await runPublishTick(new Date());
    await runMetricSync([user.id]);
    return ok(report);
  } catch (err) {
    return handleError(err);
  }
}
