"use client";

import { motion } from "framer-motion";
import { StreamChart } from "@/components/charts/stream-chart";
import { TimingHeatmap } from "@/components/charts/timing-heatmap";
import { EngagementFunnel } from "@/components/charts/funnel";
import { Odometer } from "@/components/ui/odometer";
import { Sparkline } from "@/components/charts/sparkline";
import type { AnalyticsBundle } from "@/lib/types";
import { percent } from "@/lib/utils";

export function AnalyticsPreview({ bundle }: { bundle: AnalyticsBundle }) {
  return (
    <section id="analytics" className="relative z-10 mx-auto max-w-[var(--shell-max)] px-6 py-28">
      <div className="mb-14 grid gap-8 md:grid-cols-[1fr_1.1fr] md:items-end">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-[var(--aurora-magenta)]">
            Aurora analytics
          </p>
          <h2 className="mt-3 text-4xl md:text-5xl">
            The numbers, read for you.
          </h2>
          <p className="mt-4 max-w-md text-[var(--muted-foreground)]">
            Impression growth, engagement rate and your best posting windows, all computed with
            MongoDB aggregation pipelines over every snapshot Aetheria has collected.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Impressions", value: bundle.totals.impressions, fmt: "compact" as const },
            {
              label: "Engagement",
              value: bundle.totals.engagementRate * 100,
              fmt: "percent" as const,
            },
            { label: "Cadence", value: bundle.totals.cadenceScore, fmt: "plain" as const },
          ].map((s) => (
            <div key={s.label} className="panel p-4">
              <p className="text-xs text-[var(--faint-foreground)]">{s.label}</p>
              <p className="mt-1 font-display text-xl font-semibold">
                <Odometer value={s.value} format={s.fmt} />
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="panel p-5"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-[var(--muted-foreground)]">Impression growth</h3>
            <div className="flex items-center gap-2 text-xs text-[var(--aurora-teal)]">
              <Sparkline data={bundle.velocity} width={80} height={24} />
              +{percent(bundle.totals.growthRate, 1)}
            </div>
          </div>
          <StreamChart data={bundle.growth} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="panel p-5"
        >
          <h3 className="mb-3 text-sm font-medium text-[var(--muted-foreground)]">Engagement funnel</h3>
          <EngagementFunnel stages={bundle.funnel} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="panel p-5 lg:col-span-2"
        >
          <h3 className="mb-4 text-sm font-medium text-[var(--muted-foreground)]">
            Optimal posting windows
          </h3>
          <TimingHeatmap cells={bundle.timing} />
        </motion.div>
      </div>
    </section>
  );
}
