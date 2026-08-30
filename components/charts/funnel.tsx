"use client";

import { motion } from "framer-motion";
import { compactNumber, percent } from "@/lib/utils";

export function EngagementFunnel({ stages }: { stages: { stage: string; value: number }[] }) {
  const top = Math.max(1, stages[0]?.value ?? 1);
  return (
    <div className="space-y-2.5">
      {stages.map((s, i) => {
        const ratio = s.value / top;
        return (
          <div key={s.stage}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-[var(--muted-foreground)]">{s.stage}</span>
              <span className="font-mono text-[var(--foreground)]">
                {compactNumber(s.value)}
                {i > 0 ? (
                  <span className="ml-1.5 text-[var(--faint-foreground)]">{percent(ratio, 0)}</span>
                ) : null}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[var(--bg-sink)]">
              <motion.div
                className="h-full rounded-full [background:var(--aurora-gradient)]"
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.max(4, ratio * 100)}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
