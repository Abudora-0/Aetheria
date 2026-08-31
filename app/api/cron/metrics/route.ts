import { authorizeCron } from "@/lib/cron/guard";
import { runMetricSync } from "@/lib/queue/maintenance";
import { allUserIds } from "@/lib/queue/all-users";
import { fail, handleError, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

async function run(request: Request) {
  const auth = authorizeCron(request);
  if (!auth.ok) return fail(auth.reason ?? "Unauthorized", 401);
  try {
    return ok(await runMetricSync(await allUserIds()));
  } catch (err) {
    return handleError(err);
  }
}

export const GET = run;
export const POST = run;
