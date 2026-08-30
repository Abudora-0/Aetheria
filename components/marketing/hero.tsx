"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { AetheriaMark } from "@/components/brand/aetheria-mark";
import { AetherField } from "@/components/visual/aether-field";
import { AuroraBackdrop } from "@/components/visual/aurora-backdrop";
import { ButtonLink } from "@/components/ui/button";
import { Odometer } from "@/components/ui/odometer";
import { NETWORK_LIST } from "@/lib/constants";

const stat = [
  { label: "Signals published", value: 2_480_000, format: "compact" as const },
  { label: "Median time saved weekly", value: 6.4, format: "decimal" as const, suffix: "h" },
  { label: "Avg engagement lift", value: 31, format: "percent" as const },
];

export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 pt-28">
      <AuroraBackdrop />
      <AetherField className="pointer-events-none absolute inset-0 h-full w-full opacity-70" />

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10"
      >
        <AetheriaMark size={92} mode="trace" />
      </motion.div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.3 } } }}
        className="relative z-10 mt-8 flex max-w-3xl flex-col items-center text-center"
      >
        <motion.span
          variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
          className="glass mb-6 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs text-[var(--muted-foreground)]"
        >
          <Sparkles size={13} className="text-[var(--aurora-gold)]" />
          Scheduling worker, OAuth refresh and analytics in one suite
        </motion.span>

        <motion.h1
          variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
          className="text-balance text-5xl leading-[1.05] sm:text-6xl md:text-7xl"
        >
          Send your words into the <span className="aurora-text">aether</span>, on schedule.
        </motion.h1>

        <motion.p
          variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
          className="mt-6 max-w-xl text-lg text-[var(--muted-foreground)]"
        >
          Aetheria drafts, schedules and auto publishes across every network, then reads the
          impression curves so you know exactly when to post next.
        </motion.p>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
          className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
        >
          <ButtonLink href="/sign-up" size="lg">
            Start free <ArrowRight size={16} />
          </ButtonLink>
          <ButtonLink href="/sign-in" size="lg" variant="outline" magnetic={false}>
            Explore the demo
          </ButtonLink>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.8 }}
        className="relative z-10 mt-16 grid w-full max-w-3xl grid-cols-1 gap-px overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3"
      >
        {stat.map((s) => (
          <div key={s.label} className="bg-[var(--bg-raise)] p-5 text-center">
            <div className="font-display text-2xl font-semibold text-[var(--foreground)]">
              <Odometer value={s.value} format={s.format} suffix={s.suffix} />
            </div>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">{s.label}</p>
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="relative z-10 mt-12 flex flex-wrap items-center justify-center gap-6 text-[var(--faint-foreground)]"
      >
        <span className="text-xs uppercase tracking-widest">Publishes to</span>
        {NETWORK_LIST.map((n) => (
          <span key={n.id} className="flex items-center gap-1.5 text-sm">
            <n.icon size={16} style={{ color: n.accent }} />
            {n.name}
          </span>
        ))}
      </motion.div>
    </section>
  );
}
