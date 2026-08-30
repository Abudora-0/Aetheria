import { requireApiUser } from "@/lib/api-auth";
import { getData } from "@/lib/data";
import { env } from "@/lib/env";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { fail, handleError, ok } from "@/lib/http";

export const runtime = "nodejs";

export async function POST() {
  try {
    const user = await requireApiUser();
    if (!stripeConfigured()) return fail("Stripe portal is unavailable in demo mode", 400);

    const data = await getData();
    const sub = await data.subscription.forUser(user.id);
    if (!sub.stripeCustomerId) return fail("No billing account yet", 400);

    const session = await stripe().billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: env.stripe.portalReturnUrl ?? `${env.appUrl}/studio/billing`,
    });
    return ok({ url: session.url });
  } catch (err) {
    return handleError(err);
  }
}
