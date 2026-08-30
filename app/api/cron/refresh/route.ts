import { authorizeCron } from "@/lib/cron/guard";
import { runTokenRefresh } from "@/lib/queue/maintenance";
import { fail, handleError, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function run(request: Request) {
  const auth = authorizeCron(request);
  if (!auth.ok) return fail(auth.reason ?? "Unauthorized", 401);
  try {
    return ok(await runTokenRefresh());
  } catch (err) {
    return handleError(err);
  }
}

export const GET = run;
export const POST = run;
