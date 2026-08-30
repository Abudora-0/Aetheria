import Stripe from "stripe";
import { env, integrations } from "@/lib/env";
import { PLANS, type PlanId } from "@/lib/constants";

let client: Stripe | null = null;

export function stripe(): Stripe {
  if (!integrations.stripe) throw new Error("Stripe is not configured");
  if (!client) {
    client = new Stripe(env.stripe.secretKey!, { typescript: true });
  }
  return client;
}

export function priceIdForPlan(plan: PlanId): string | undefined {
  if (plan === "creator") return env.stripe.priceCreator;
  if (plan === "studio") return env.stripe.priceStudio;
  return undefined;
}

export function planForPriceId(priceId: string | undefined | null): PlanId {
  if (priceId && priceId === env.stripe.priceCreator) return "creator";
  if (priceId && priceId === env.stripe.priceStudio) return "studio";
  return "free";
}

export const stripeConfigured = () => integrations.stripe;

export function planCatalogue() {
  return Object.values(PLANS).map((p) => ({
    ...p,
    priceId: priceIdForPlan(p.id) ?? null,
    checkoutReady: p.id === "free" || Boolean(priceIdForPlan(p.id)),
  }));
}
