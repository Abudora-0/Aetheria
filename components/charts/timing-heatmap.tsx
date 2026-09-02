"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { TimingCell } from "@/lib/types";
import { percent } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** 7x24 engagement grid. Colour maps from faint border to full aurora. */
export function TimingHeatmap({ cells }: { cells: TimingCell[] }) {
  const [hover, setHover] = useState<TimingCell | null>(null);
  const { lookup, max } = useMemo(() => {
    const lookup = new Map<string, TimingCell>();
    let max = 0;
    for (const c of cells) {
      lookup.set(`${c.day}:${c.hour}`, c);
      if (c.score > max) max = c.score;
    }
    return { lookup, max: max || 1 };
  }, [cells]);

  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <div className="grid min-w-[420px] grid-cols-[auto_1fr] gap-x-2">
        <div />
        <div className="mb-1 flex justify-between px-0.5 text-[0.55rem] text-[var(--faint-foreground)]">
          {[0, 6, 12, 18, 23].map((h) => (
            <span key={h}>{String(h).padStart(2, "0")}</span>
          ))}
        </div>
        {DAYS.map((day, d) => (
          <div key={day} className="contents">
            <span className="pr-1 text-right text-[0.6rem] leading-4 text-[var(--faint-foreground)]">
              {day}
            </span>
            <div className="mb-0.5 flex gap-0.5">
              {Array.from({ length: 24 }).map((_, h) => {
                const cell = lookup.get(`${d}:${h}`);
                const intensity = cell ? cell.score / max : 0;
                return (
                  <motion.button
                    key={h}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: (d * 24 + h) * 0.001 }}
                    onMouseEnter={() => cell && setHover(cell)}
                    onMouseLeave={() => setHover(null)}
                    className="h-4 flex-1 rounded-[3px] transition-transform hover:scale-125"
                    style={{
                      background:
                        intensity > 0
                          ? `color-mix(in oklab, var(--aurora-violet) ${12 + intensity * 78}%, var(--bg-sink))`
                          : "var(--bg-sink)",
                    }}
                    aria-label={cell ? `${DAYS[d]} ${h}:00, ${percent(cell.score)} engagement` : undefined}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 h-4 text-xs text-[var(--muted-foreground)]">
        {hover
          ? `${DAYS[hover.day]} ${String(hover.hour).padStart(2, "0")}:00  -  ${percent(hover.score)} engagement across ${hover.samples} post${hover.samples === 1 ? "" : "s"}`
          : "Hover a cell to inspect that window"}
      </div>
    </div>
  );
}
