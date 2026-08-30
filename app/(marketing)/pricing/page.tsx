import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { PLAN_LIST } from "@/lib/constants";
import { ButtonLink } from "@/components/ui/button";
import { AuroraBackdrop } from "@/components/visual/aurora-backdrop";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple plans for creators and studios. Free forever for two channels.",
};

export default function PricingPage() {
  return (
    <div className="relative px-6 pb-28 pt-36">
      <AuroraBackdrop subtle />
      <div className="relative z-10 mx-auto max-w-[var(--shell-max)]">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-5xl md:text-6xl">
            Priced for the <span className="aurora-text">long run</span>.
          </h1>
          <p className="mt-5 text-lg text-[var(--muted-foreground)]">
            Start free, upgrade when the cadence picks up. Every plan includes the scheduling worker,
            OAuth refresh and the analytics pipelines.
          </p>
        </div>

        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          {PLAN_LIST.map((plan) => (
            <div
              key={plan.id}
              className={`panel relative flex flex-col p-6 ${
                plan.id === "creator" ? "border-[var(--aurora-violet)]" : ""
              }`}
            >
              {plan.id === "creator" ? (
                <span className="absolute -top-3 left-6 rounded-full [background:var(--aurora-gradient)] px-3 py-0.5 text-xs font-semibold text-[#07080d]">
                  Most popular
                </span>
              ) : null}
              <h2 className="text-xl">{plan.name}</h2>
              <p className="text-sm text-[var(--muted-foreground)]">{plan.tagline}</p>
              <p className="mt-4 font-display text-4xl font-semibold">
                ${plan.price}
                <span className="text-base font-normal text-[var(--faint-foreground)]">
                  {" "}
                  / {plan.cadence}
                </span>
              </p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[var(--muted-foreground)]">
                    <Check size={15} className="mt-0.5 shrink-0 text-[var(--aurora-teal)]" />
                    {f}
                  </li>
                ))}
              </ul>
              <ButtonLink
                href="/sign-up"
                variant={plan.id === "creator" ? "primary" : "outline"}
                magnetic={false}
                className="mt-6 w-full"
              >
                {plan.price === 0 ? "Start free" : `Choose ${plan.name}`}
              </ButtonLink>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-[var(--muted-foreground)]">
          Questions about volume or teams?{" "}
          <Link href="/sign-up" className="text-[var(--foreground)] underline">
            Get in touch
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
