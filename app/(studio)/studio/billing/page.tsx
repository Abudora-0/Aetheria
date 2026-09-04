import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getAccountsForUser, getPostsForUser, getSubscriptionForUser } from "@/lib/data/request-cache";
import { planCatalogue, stripeConfigured } from "@/lib/stripe";
import { PageHeader } from "@/components/studio/primitives";
import { BillingPanel } from "@/components/studio/billing-panel";

export const metadata: Metadata = { title: "Billing" };
export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const user = (await getCurrentUser())!;
  const [subscription, posts, accounts] = await Promise.all([
    getSubscriptionForUser(user.id),
    getPostsForUser(user.id),
    getAccountsForUser(user.id),
  ]);

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const usage = {
    channels: accounts.length,
    scheduledThisMonth: posts.filter((p) => p.status !== "draft" && p.createdAt >= since).length,
  };

  return (
    <div>
      <PageHeader
        title="Billing Nebula"
        description="Plans, usage meters and the Stripe subscription lifecycle. Downgrade and your limits follow."
      />
      <BillingPanel
        subscription={subscription}
        plans={planCatalogue()}
        usage={usage}
        stripeLive={stripeConfigured()}
      />
    </div>
  );
}
