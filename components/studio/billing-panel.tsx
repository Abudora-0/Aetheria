"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { PLANS, type PlanId, type PlanMeta } from "@/lib/constants";
import type { SubscriptionRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/ui/progress-ring";
import { useToast } from "@/components/ui/toast";

type PlanCard = PlanMeta & { priceId: string | null; checkoutReady: boolean };

export function BillingPanel({
  subscription,
  plans,
  usage,
  stripeLive,
}: {
  subscription: SubscriptionRecord;
  plans: PlanCard[];
  usage: { channels: number; scheduledThisMonth: number };
  stripeLive: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const currentPlan = PLANS[subscription.plan];

  async function choose(plan: PlanId) {
    if (plan === subscription.plan) return;
    setBusy(plan);
    try {
      if (plan === "free") {
        await simulate("cancel", "free");
        return;
      }
      if (stripeLive) {
        const res = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ plan }),
        });
        const json = await res.json();
        if (json.data?.url) {
          window.location.href = json.data.url;
          return;
        }
        toast.error(json.error ?? "Checkout unavailable");
        return;
      }
      await simulate("subscribe", plan);
    } finally {
      setBusy(null);
    }
  }

  async function simulate(event: string, plan: PlanId) {
    const res = await fetch("/api/billing/simulate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event, plan }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Failed");
      return;
    }
    toast.success(
      event === "cancel" ? "Moved to Drift" : `Now on ${PLANS[plan].name}`,
      "Mirrors the Stripe webhook path",
    );
    router.refresh();
  }

  async function portal() {
    setBusy("portal");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const json = await res.json();
      if (json.data?.url) window.location.href = json.data.url;
      else toast.error(json.error ?? "Portal unavailable");
    } finally {
      setBusy(null);
    }
  }

  const channelPct = usage.channels / currentPlan.limits.channels;
  const schedulePct = usage.scheduledThisMonth / currentPlan.limits.scheduledPerMonth;

  return (
    <div className="space-y-5">
      <div className="panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg">{currentPlan.name}</h2>
            <Badge
              tone={
                subscription.status === "active"
                  ? "var(--aurora-teal)"
                  : subscription.status === "past_due"
                    ? "var(--danger)"
                    : "var(--aurora-gold)"
              }
              dot
            >
              {subscription.status}
            </Badge>
            <Badge tone="var(--faint-foreground)">{subscription.source}</Badge>
          </div>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {subscription.plan === "free"
              ? "Free forever."
              : `Renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <ProgressRing value={channelPct} label={`${usage.channels}`} sublabel="ch" size={48} />
            <ProgressRing
              value={schedulePct}
              label={`${usage.scheduledThisMonth}`}
              sublabel="30d"
              size={48}
            />
          </div>
          {stripeLive && subscription.stripeCustomerId ? (
            <Button variant="outline" size="sm" magnetic={false} onClick={portal} disabled={busy === "portal"}>
              {busy === "portal" ? <Loader2 size={13} className="animate-spin" /> : <ExternalLink size={13} />}
              Manage
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const active = plan.id === subscription.plan;
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className={`panel relative flex flex-col p-5 ${
                active ? "border-[var(--aurora-violet)]" : ""
              }`}
            >
              {plan.id === "creator" ? (
                <span className="absolute -top-2.5 left-5 flex items-center gap-1 rounded-full [background:var(--aurora-gradient)] px-2 py-0.5 text-[0.6rem] font-semibold text-[#07080d]">
                  <Sparkles size={9} /> Popular
                </span>
              ) : null}
              <h3 className="text-lg">{plan.name}</h3>
              <p className="text-xs text-[var(--muted-foreground)]">{plan.tagline}</p>
              <p className="mt-3 font-display text-3xl font-semibold">
                ${plan.price}
                <span className="text-sm font-normal text-[var(--faint-foreground)]">
                  {" "}
                  / {plan.cadence}
                </span>
              </p>
              <ul className="mt-4 flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-[var(--muted-foreground)]">
                    <Check size={13} className="mt-0.5 shrink-0 text-[var(--aurora-teal)]" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-5 w-full"
                variant={active ? "outline" : "primary"}
                magnetic={false}
                disabled={active || busy === plan.id}
                onClick={() => choose(plan.id)}
              >
                {busy === plan.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : active ? (
                  "Current plan"
                ) : plan.id === "free" ? (
                  "Downgrade"
                ) : stripeLive ? (
                  "Upgrade with Stripe"
                ) : (
                  "Simulate upgrade"
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>

      {!stripeLive ? (
        <p className="text-center text-xs text-[var(--faint-foreground)]">
          Stripe keys are not set, so plan changes use the simulate endpoint which follows the exact
          same lifecycle the webhook would.
        </p>
      ) : null}
    </div>
  );
}
