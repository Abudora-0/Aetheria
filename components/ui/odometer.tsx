"use client";

import { animate, useInView, useMotionValue } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { compactNumber } from "@/lib/utils";
import { useMotionPrefs } from "@/components/system/motion-prefs";

interface OdometerProps {
  value: number;
  className?: string;
  /** compact -> 1.2K, plain -> 1,234, decimal -> 6.4, percent -> 12.3% */
  format?: "compact" | "plain" | "decimal" | "percent";
  duration?: number;
  prefix?: string;
  suffix?: string;
}

function render(value: number, format: OdometerProps["format"]) {
  if (format === "compact") return compactNumber(value, 1);
  if (format === "percent") return `${value.toFixed(1)}%`;
  if (format === "decimal") return value.toFixed(1);
  return Math.round(value).toLocaleString("en-US");
}

/**
 * Number that rolls to its target with aether easing. The digits sit on a
 * monospace baseline so the width does not jitter mid-count.
 */
export function Odometer({
  value,
  className,
  format = "compact",
  duration = 1.4,
  prefix = "",
  suffix = "",
}: OdometerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(() => render(0, format));
  const { reduced } = useMotionPrefs();

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setDisplay(render(value, format));
      return;
    }
    const controls = animate(mv, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        const next = render(v, format);
        // The rendered string only changes a handful of times over the count
        // (compact / rounded formats), so skip the re-render when it is stable.
        setDisplay((prev) => (prev === next ? prev : next));
      },
    });
    return () => controls.stop();
  }, [inView, value, format, duration, mv, reduced]);

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
