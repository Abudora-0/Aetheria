import { requireApiUser } from "@/lib/api-auth";
import { getData } from "@/lib/data";
import { runPublishTick } from "@/lib/queue/scheduler";
import { fail, handleError, ok } from "@/lib/http";

export const runtime = "nodejs";

/** Move a post to "due now" and run one worker tick. Handy for the demo. */
export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser();
    const { id } = await ctx.params;
    const data = await getData();
    const post = await data.posts.findById(user.id, id);
    if (!post) return fail("Not found", 404);
    if (post.status === "published") return fail("Already published", 409);

    await data.posts.reschedule(user.id, id, new Date(Date.now() - 1000).toISOString());
    const report = await runPublishTick(new Date());
    const updated = await data.posts.findById(user.id, id);
    return ok({ report, post: updated });
  } catch (err) {
    return handleError(err);
  }
}
