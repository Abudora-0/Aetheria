import { z } from "zod";
import { getData } from "@/lib/data";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/email/templates";
import { fail, handleError, ok, tooMany } from "@/lib/http";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email(),
  password: z.string().min(6).max(120),
  timezone: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const gate = rateLimit(`signup:${clientIp(request)}`, 5, 60 * 60_000);
    if (!gate.ok) return tooMany(gate.retryAfterSeconds);

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
    await sendEmail(welcomeEmail(user.email, user.name)).catch(() => {});
    return ok({ user });
  } catch (err) {
    return handleError(err);
  }
}
