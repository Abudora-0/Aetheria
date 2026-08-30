import { z } from "zod";
import { requireApiUser } from "@/lib/api-auth";
import { getData } from "@/lib/data";
import { fail, handleError, ok } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser();
    const { id } = await ctx.params;
    const data = await getData();
    const post = await data.posts.findById(user.id, id);
    if (!post) return fail("Not found", 404);
    return ok({ post });
  } catch (err) {
    return handleError(err);
  }
}

const patchSchema = z.object({
  action: z.enum(["reschedule", "cancel"]),
  scheduledFor: z.string().datetime().optional(),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser();
    const { id } = await ctx.params;
    const body = patchSchema.parse(await request.json());
    const data = await getData();

    if (body.action === "cancel") {
      await data.posts.cancel(user.id, id);
      return ok({ id, status: "cancelled" });
    }

    if (!body.scheduledFor) return fail("Missing time", 422);
    if (new Date(body.scheduledFor).getTime() < Date.now() - 60_000) {
      return fail("That time is in the past", 422);
    }
    const post = await data.posts.reschedule(user.id, id, body.scheduledFor);
    return ok({ post });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser();
    const { id } = await ctx.params;
    const data = await getData();
    await data.posts.cancel(user.id, id);
    return ok({ id });
  } catch (err) {
    return handleError(err);
  }
}
