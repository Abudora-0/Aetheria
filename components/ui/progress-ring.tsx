"use client";

import { motion } from "framer-motion";
import { useId } from "react";
import { clamp } from "@/lib/utils";

interface ProgressRingProps {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  tone?: string;
  showValue?: boolean;
}

/** Radial progress used for character counters and usage meters. */
export function ProgressRing({
  value,
  size = 44,
  stroke = 4,
  label,
  sublabel,
  tone,
  showValue = true,
}: ProgressRingProps) {
  const gid = useId().replace(/[:]/g, "");
  const v = clamp(value, 0, 1);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const over = value > 1;

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`ring-${gid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--aurora-teal)" />
            <stop offset="100%" stopColor="var(--aurora-magenta)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={over ? "var(--danger)" : tone ?? `url(#ring-${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - c * v }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </svg>
      {showValue ? (
        <div className="absolute grid place-items-center text-center">
          <span className="font-mono text-[0.7rem] font-medium text-[var(--foreground)]">
            {label ?? `${Math.round(v * 100)}`}
          </span>
          {sublabel ? (
            <span className="text-[0.55rem] text-[var(--faint-foreground)]">{sublabel}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
