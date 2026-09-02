import { z } from "zod";
import { getData } from "@/lib/data";
import { env, integrations } from "@/lib/env";
import { sendEmail } from "@/lib/email";
import { resetPasswordEmail } from "@/lib/email/templates";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { handleError, ok, tooMany } from "@/lib/http";

export const runtime = "nodejs";

const schema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  try {
    const gate = rateLimit(`forgot:${clientIp(request)}`, 5, 15 * 60_000);
    if (!gate.ok) return tooMany(gate.retryAfterSeconds);

    const { email } = schema.parse(await request.json());
    const data = await getData();
    const issued = await data.users.createResetToken(email);

    if (issued) {
      const link = `${env.appUrl.replace(/\/+$/, "")}/reset?token=${issued.token}`;
      if (!integrations.email) {
        console.log(`[aetheria] password reset link for ${issued.user.email}: ${link}`);
      }
      await sendEmail(resetPasswordEmail(issued.user.email, link));
    }

    // Always the same response so the endpoint cannot be used to probe for accounts.
    return ok({ sent: true });
  } catch (err) {
    return handleError(err);
  }
}
