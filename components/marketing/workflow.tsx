"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const STEPS = [
  {
    k: "01",
    title: "Draft in the Composer",
    body: "Write once. Aetheria forks a variant per network so each one respects its own limits and tone.",
  },
  {
    k: "02",
    title: "Drop it on The Dial",
    body: "Pick a slot, or let the Optimal Time Halo suggest one from your past engagement.",
  },
  {
    k: "03",
    title: "The worker takes over",
    body: "A cron tick claims the job atomically, refreshes any stale OAuth token, and publishes.",
  },
  {
    k: "04",
    title: "Watch the aether respond",
    body: "Metric snapshots stream into the aggregation pipelines and the growth curves update.",
  },
];

export function Workflow() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const lineHeight = useTransform(scrollYProgress, [0.1, 0.8], ["0%", "100%"]);

  return (
    <section id="workflow" ref={ref} className="relative z-10 mx-auto max-w-[var(--shell-max)] px-6 py-28">
      <div className="mb-16 max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-widest text-[var(--aurora-teal)]">
          The loop
        </p>
        <h2 className="mt-3 text-4xl md:text-5xl">Four steps, then it runs without you.</h2>
      </div>

      <div className="relative pl-10 md:pl-16">
        <div className="absolute left-3 top-2 h-full w-px bg-[var(--border)] md:left-5" />
        <motion.div
          className="absolute left-3 top-2 w-px [background:var(--aurora-gradient)] md:left-5"
          style={{ height: lineHeight }}
        />

        <div className="space-y-16">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.k}
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <span className="absolute -left-[2.35rem] top-0 grid h-6 w-6 place-items-center rounded-full border border-[var(--border-strong)] bg-[var(--bg)] font-mono text-[0.6rem] text-[var(--aurora-violet)] md:-left-[3.35rem]">
                {i + 1}
              </span>
              <p className="font-mono text-xs text-[var(--faint-foreground)]">{s.k}</p>
              <h3 className="mt-1 text-2xl">{s.title}</h3>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-[var(--muted-foreground)]">
                {s.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
