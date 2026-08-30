import { authorizeCron } from "@/lib/cron/guard";
import { runPublishTick } from "@/lib/queue/scheduler";
import { fail, handleError, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function run(request: Request) {
  const auth = authorizeCron(request);
  if (!auth.ok) return fail(auth.reason ?? "Unauthorized", 401);
  try {
    const report = await runPublishTick();
    return ok(report);
  } catch (err) {
    return handleError(err);
  }
}

export const GET = run;
export const POST = run;
