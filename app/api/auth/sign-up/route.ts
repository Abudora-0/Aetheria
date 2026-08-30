import { z } from "zod";
import { getData } from "@/lib/data";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { fail, handleError, ok } from "@/lib/http";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email(),
  password: z.string().min(6).max(120),
  timezone: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const data = await getData();

    const existing = await data.users.findByEmail(body.email);
    if (existing) return fail("An account with that email already exists", 409);

    const user = await data.users.create({
      name: body.name,
      email: body.email,
      password: body.password,
      passwordHash: await hashPassword(body.password),
      timezone: body.timezone,
    });

    await createSession(user.id);
    return ok({ user });
  } catch (err) {
    return handleError(err);
  }
}
