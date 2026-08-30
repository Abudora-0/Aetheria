import type Stripe from "stripe";
import { env } from "@/lib/env";
import { getData } from "@/lib/data";
import { stripe, planForPriceId, stripeConfigured } from "@/lib/stripe";
import { fail, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe subscription lifecycle. Handles the events that change what a user
 * can do: checkout completion, subscription updates (plan change, past due)
 * and cancellation.
 */
export async function POST(request: Request) {
  if (!stripeConfigured() || !env.stripe.webhookSecret) {
    return fail("Stripe webhook is not configured", 400);
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return fail("Missing signature", 400);

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(payload, signature, env.stripe.webhookSecret);
  } catch (err) {
    return fail(`Signature check failed: ${err instanceof Error ? err.message : "unknown"}`, 400);
  }

  const data = await getData();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId ?? session.client_reference_id;
        if (!userId) break;
        const subId = session.subscription as string;
        const full = await stripe().subscriptions.retrieve(subId);
        const priceId = full.items.data[0]?.price?.id;
        await data.subscription.upsert(userId, {
          plan: planForPriceId(priceId),
          status: "active",
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: subId,
          currentPeriodEnd: new Date(currentPeriodEnd(full) * 1000).toISOString(),
          cancelAtPeriodEnd: full.cancel_at_period_end,
          source: "stripe",
        });
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (!userId) break;
        const priceId = sub.items.data[0]?.price?.id;
        const status =
          sub.status === "active" || sub.status === "trialing"
            ? "active"
            : sub.status === "past_due" || sub.status === "unpaid"
              ? "past_due"
              : "canceled";
        await data.subscription.upsert(userId, {
          plan: status === "active" ? planForPriceId(priceId) : "free",
          status,
          stripeSubscriptionId: sub.id,
          currentPeriodEnd: new Date(currentPeriodEnd(sub) * 1000).toISOString(),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          source: "stripe",
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (!userId) break;
        await data.subscription.upsert(userId, {
          plan: "free",
          status: "canceled",
          cancelAtPeriodEnd: false,
          source: "stripe",
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId =
          typeof (invoice as { subscription?: unknown }).subscription === "string"
            ? ((invoice as { subscription?: string }).subscription as string)
            : null;
        if (!subId) break;
        const full = await stripe().subscriptions.retrieve(subId);
        const userId = full.metadata?.userId;
        if (userId) await data.subscription.upsert(userId, { status: "past_due", source: "stripe" });
        break;
      }
    }
  } catch (err) {
    console.error("[aetheria] stripe webhook handler error", err);
    return fail("Handler error", 500);
  }

  return ok({ received: true, type: event.type });
}

function currentPeriodEnd(sub: Stripe.Subscription): number {
  const raw = (sub as unknown as { current_period_end?: number }).current_period_end;
  if (typeof raw === "number") return raw;
  const item = sub.items.data[0] as unknown as { current_period_end?: number };
  return item.current_period_end ?? Math.floor(Date.now() / 1000) + 30 * 86400;
}
