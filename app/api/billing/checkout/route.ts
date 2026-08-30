import { z } from "zod";
import { requireApiUser } from "@/lib/api-auth";
import { getData } from "@/lib/data";
import { env } from "@/lib/env";
import { priceIdForPlan, stripe, stripeConfigured } from "@/lib/stripe";
import { fail, handleError, ok } from "@/lib/http";

export const runtime = "nodejs";

const schema = z.object({ plan: z.enum(["creator", "studio"]) });

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const { plan } = schema.parse(await request.json());

    if (!stripeConfigured()) {
      return ok({ mode: "simulate", message: "Stripe keys absent, use the simulate endpoint" });
    }

    const priceId = priceIdForPlan(plan);
    if (!priceId) return fail(`No Stripe price configured for the ${plan} plan`, 400);

    const data = await getData();
    const sub = await data.subscription.forUser(user.id);

    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer: sub.stripeCustomerId ?? undefined,
      customer_email: sub.stripeCustomerId ? undefined : user.email,
      client_reference_id: user.id,
      metadata: { userId: user.id, plan },
      subscription_data: { metadata: { userId: user.id } },
      success_url: `${env.appUrl}/studio/billing?checkout=success`,
      cancel_url: `${env.appUrl}/studio/billing?checkout=cancelled`,
    });

    return ok({ mode: "stripe", url: session.url });
  } catch (err) {
    return handleError(err);
  }
}
