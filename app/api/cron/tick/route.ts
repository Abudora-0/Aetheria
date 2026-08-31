import { authorizeCron } from "@/lib/cron/guard";
import { runPublishTick } from "@/lib/queue/scheduler";
import { runMetricSync, runTokenRefresh } from "@/lib/queue/maintenance";
import { allUserIds } from "@/lib/queue/all-users";
import { fail, handleError, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Combined worker tick: publish due signals, refresh expiring OAuth tokens and
 * pull fresh metrics in one pass. This is the single cron entry the Hobby plan
 * allows. For minute level scheduling, point an external cron at
 * /api/cron/publish?key=CRON_SECRET or upgrade to Pro.
 */
async function run(request: Request) {
  const auth = authorizeCron(request);
  if (!auth.ok) return fail(auth.reason ?? "Unauthorized", 401);
  try {
    const publish = await runPublishTick();
    const refresh = await runTokenRefresh();
    const metrics = await runMetricSync(await allUserIds());
    return ok({ publish, refresh, metrics });
  } catch (err) {
    return handleError(err);
  }
}

export const GET = run;
export const POST = run;
