"use client";

import { motion } from "framer-motion";
import {
  CalendarClock,
  Compass,
  Radio,
  RefreshCw,
  ShieldCheck,
  Waves,
} from "lucide-react";

const FEATURES = [
  {
    icon: CalendarClock,
    title: "The Dial",
    body: "A radial 24 hour clock and a constellation week view. Drag a signal to reschedule it, the worker picks up the change on the next tick.",
    span: "md:col-span-2",
    accent: "var(--aurora-teal)",
  },
  {
    icon: Compass,
    title: "Optimal Time Halo",
    body: "Golden windows computed from your own engagement history, overlaid right on the composer.",
    span: "",
    accent: "var(--aurora-gold)",
  },
  {
    icon: Radio,
    title: "Signal Queue",
    body: "Every upcoming auto publish with a live countdown, status pulse and one tap retry when a network hiccups.",
    span: "",
    accent: "var(--aurora-violet)",
  },
  {
    icon: Waves,
    title: "Aurora Analytics",
    body: "Impression growth with a 7 day moving average, engagement rate per network, and a cadence score, all from MongoDB aggregation pipelines.",
    span: "md:col-span-2",
    accent: "var(--aurora-magenta)",
  },
  {
    icon: RefreshCw,
    title: "Token Vault",
    body: "OAuth tokens encrypted at rest with AES-256-GCM and refreshed automatically before they lapse.",
    span: "",
    accent: "var(--aurora-teal)",
  },
  {
    icon: ShieldCheck,
    title: "Billing that behaves",
    body: "Stripe checkout, the customer portal and a webhook driven subscription lifecycle. Downgrade and your limits follow.",
    span: "md:col-span-2",
    accent: "var(--aurora-violet)",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="relative z-10 mx-auto max-w-[var(--shell-max)] px-6 py-28">
      <div className="mb-14 max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-widest text-[var(--aurora-violet)]">
          The suite
        </p>
        <h2 className="mt-3 text-4xl md:text-5xl">Everything between the draft and the data.</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.article
            key={f.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: (i % 3) * 0.06 }}
            className={`panel group relative overflow-hidden p-6 ${f.span}`}
          >
            <div
              className="absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
              style={{ background: f.accent }}
            />
            <f.icon size={22} style={{ color: f.accent }} />
            <h3 className="mt-4 text-xl">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">{f.body}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
