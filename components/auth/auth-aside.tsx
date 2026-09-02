"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { AetheriaWordmark } from "@/components/brand/aetheria-mark";
import { AetherField } from "@/components/visual/aether-field";
import { Odometer } from "@/components/ui/odometer";
import { useMotionPrefs } from "@/components/system/motion-prefs";

const LINES = [
  "Draft once, publish everywhere on schedule.",
  "Cron workers that publish while you sleep.",
  "Analytics from real MongoDB aggregation pipelines.",
  "OAuth tokens encrypted at rest, refreshed automatically.",
];

export function AuthAside() {
  const { reduced } = useMotionPrefs();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setI((n) => (n + 1) % LINES.length), 3800);
    return () => clearInterval(id);
  }, [reduced]);

  return (
    <div className="relative hidden overflow-hidden border-r border-[var(--border)] bg-[var(--bg-sink)] lg:flex lg:flex-col lg:justify-between lg:p-12">
      <AetherField className="pointer-events-none absolute inset-0 h-full w-full opacity-50" />
      <div
        className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full opacity-25 blur-[100px]"
        style={{ background: "var(--aurora-violet)" }}
      />

      <div className="relative z-10">
        <AetheriaWordmark size={40} mode="static" />
      </div>

      <div className="relative z-10 max-w-md">
        <h2 className="text-balance text-4xl leading-[1.1]">
          The aether is <span className="aurora-text">listening</span>.
        </h2>
        <div className="mt-5 h-12">
          <AnimatePresence mode="wait">
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="text-[var(--muted-foreground)]"
            >
              {LINES[i]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <div className="relative z-10 flex items-end gap-8">
        <div>
          <div className="font-display text-2xl font-semibold text-[var(--foreground)]">
            <Odometer value={2_480_000} format="compact" />
          </div>
          <p className="text-xs text-[var(--faint-foreground)]">signals sent</p>
        </div>
        <div>
          <div className="font-display text-2xl font-semibold text-[var(--foreground)]">
            <Odometer value={31} format="percent" />
          </div>
          <p className="text-xs text-[var(--faint-foreground)]">avg engagement lift</p>
        </div>
      </div>
    </div>
  );
}

/** Slim branded strip shown above the form on small screens. */
export function AuthAsideMobile() {
  return (
    <div className="relative mb-6 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-sink)] p-4 lg:hidden">
      <span className="absolute inset-x-0 top-0 h-px [background:var(--aurora-gradient)]" />
      <AetheriaWordmark size={30} mode="static" />
      <p className="mt-2 text-xs text-[var(--muted-foreground)]">
        Draft once, publish everywhere, read the curves.
      </p>
    </div>
  );
}
