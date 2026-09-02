import { z } from "zod";
import { getData } from "@/lib/data";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { fail, handleError, ok, tooMany } from "@/lib/http";

export const runtime = "nodejs";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(6).max(120),
});

export async function POST(request: Request) {
  try {
    const gate = rateLimit(`reset:${clientIp(request)}`, 10, 15 * 60_000);
    if (!gate.ok) return tooMany(gate.retryAfterSeconds);

    const body = schema.parse(await request.json());
    const data = await getData();

    const userId = await data.users.consumeResetToken(body.token);
    if (!userId) return fail("That reset link is invalid or has expired", 400);

    await data.users.updatePassword(userId, await hashPassword(body.password));
    await createSession(userId);

    return ok({ reset: true });
  } catch (err) {
    return handleError(err);
  }
}
