import { requireApiUser } from "@/lib/api-auth";
import { getData } from "@/lib/data";
import { handleError, ok } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser();
    const { id } = await ctx.params;
    const data = await getData();
    const account = await data.accounts.refresh(user.id, id);
    return ok({ account });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser();
    const { id } = await ctx.params;
    const data = await getData();
    await data.accounts.disconnect(user.id, id);
    return ok({ id });
  } catch (err) {
    return handleError(err);
  }
}
