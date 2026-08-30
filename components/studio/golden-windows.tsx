"use client";

import { motion } from "framer-motion";
import { Compass } from "lucide-react";
import type { GoldenWindow } from "@/lib/types";
import { percent } from "@/lib/utils";

export function GoldenWindows({ windows }: { windows: GoldenWindow[] }) {
  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-center gap-2">
        <Compass size={15} className="text-[var(--aurora-gold)]" />
        <h2 className="text-sm font-medium text-[var(--muted-foreground)]">Golden windows</h2>
      </div>
      {windows.length === 0 ? (
        <p className="text-sm text-[var(--faint-foreground)]">
          Publish a few signals and the aether will reveal your best times.
        </p>
      ) : (
        <ol className="space-y-3">
          {windows.map((w, i) => (
            <motion.li
              key={w.label}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full border border-[var(--border-strong)] font-mono text-xs text-[var(--aurora-gold)]">
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="text-sm text-[var(--foreground)]">{w.label}</p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--bg-sink)]">
                  <div
                    className="h-full rounded-full [background:var(--aurora-gradient)]"
                    style={{ width: `${Math.min(100, w.score * 900)}%` }}
                  />
                </div>
              </div>
              <span className="font-mono text-xs text-[var(--muted-foreground)]">
                {percent(w.score)}
              </span>
            </motion.li>
          ))}
        </ol>
      )}
    </section>
  );
}
