import { z } from "zod";
import { requireApiUser } from "@/lib/api-auth";
import { getData } from "@/lib/data";
import { fail, handleError, ok } from "@/lib/http";

export const runtime = "nodejs";

/**
 * Demo path that mirrors what the Stripe webhook would do. Lets the billing
 * lifecycle be exercised end to end without live keys.
 */
const schema = z.object({
  plan: z.enum(["free", "creator", "studio"]),
  event: z.enum(["subscribe", "cancel", "past_due", "resume"]).default("subscribe"),
});

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const { plan, event } = schema.parse(await request.json());
    const data = await getData();

    if (event === "cancel") {
      const sub = await data.subscription.upsert(user.id, {
        plan: "free",
        status: "canceled",
        cancelAtPeriodEnd: false,
        source: "simulated",
      });
      return ok({ subscription: sub });
    }
    if (event === "past_due") {
      const sub = await data.subscription.upsert(user.id, { status: "past_due", source: "simulated" });
      return ok({ subscription: sub });
    }
    if (event === "resume") {
      const sub = await data.subscription.upsert(user.id, { status: "active", source: "simulated" });
      return ok({ subscription: sub });
    }

    if (plan === "free") return fail("Pick a paid plan to subscribe", 422);

    const sub = await data.subscription.upsert(user.id, {
      plan,
      status: "active",
      cancelAtPeriodEnd: false,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      source: "simulated",
    });
    return ok({ subscription: sub });
  } catch (err) {
    return handleError(err);
  }
}
