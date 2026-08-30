import { requireApiUser } from "@/lib/api-auth";
import { getAnalytics } from "@/lib/analytics/service";
import { handleError, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireApiUser();
    const days = Number(new URL(request.url).searchParams.get("days") ?? 90);
    const bundle = await getAnalytics(user.id, Number.isFinite(days) ? days : 90, user.timezone);
    return ok(bundle);
  } catch (err) {
    return handleError(err);
  }
}
