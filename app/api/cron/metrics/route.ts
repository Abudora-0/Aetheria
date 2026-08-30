import { authorizeCron } from "@/lib/cron/guard";
import { runMetricSync } from "@/lib/queue/maintenance";
import { resolveDataMode } from "@/lib/env";
import { DEMO_USER } from "@/lib/demo/generate";
import { fail, handleError, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

async function run(request: Request) {
  const auth = authorizeCron(request);
  if (!auth.ok) return fail(auth.reason ?? "Unauthorized", 401);
  try {
    let userIds: string[] = [];
    if (resolveDataMode() === "demo") {
      userIds = [DEMO_USER.id];
    } else {
      const { connectToDatabase } = await import("@/lib/db");
      const { User } = await import("@/models");
      await connectToDatabase();
      const users = await User.find().select("_id").lean();
      userIds = users.map((u) => String(u._id));
    }
    return ok(await runMetricSync(userIds));
  } catch (err) {
    return handleError(err);
  }
}

export const GET = run;
export const POST = run;
