import { z } from "zod";
import { getData } from "@/lib/data";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { fail, handleError, ok } from "@/lib/http";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const data = await getData();

    const user = await data.users.findByEmail(body.email);
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return fail("Those credentials do not match", 401);
    }

    await createSession(user.id);
    const { passwordHash: _ph, ...safe } = user;
    void _ph;
    return ok({ user: safe });
  } catch (err) {
    return handleError(err);
  }
}
