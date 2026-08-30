import { z } from "zod";
import { requireApiUser } from "@/lib/api-auth";
import { getData } from "@/lib/data";
import { handleError, ok } from "@/lib/http";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().min(2).max(60).optional(),
  timezone: z.string().min(1).max(64).optional(),
});

export async function PATCH(request: Request) {
  try {
    const user = await requireApiUser();
    const patch = schema.parse(await request.json());
    const data = await getData();
    const updated = await data.users.updateProfile(user.id, patch);
    return ok({ user: updated });
  } catch (err) {
    return handleError(err);
  }
}
