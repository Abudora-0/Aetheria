"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";
import { cn } from "@/lib/utils";

interface AetheriaMarkProps {
  size?: number;
  className?: string;
  /** "idle" loops the pulse, "trace" draws the arcs outward once, "static" is frozen. */
  mode?: "idle" | "trace" | "static";
}

const ARCS = [
  { d: "M80 53 A 27 27 0 0 1 80 107", width: 8, base: 1 },
  { d: "M80 35 A 45 45 0 0 1 80 125", width: 7, base: 0.6 },
  { d: "M80 17 A 63 63 0 0 1 80 143", width: 6, base: 0.32 },
];

/**
 * The Aetheria mark: concentric arcs radiating from a solar core, a signal
 * propagating into the aether. Used in the nav (idle), the route loader
 * (trace) and as a still for icons.
 */
export function AetheriaMark({ size = 40, className, mode = "idle" }: AetheriaMarkProps) {
  const gid = useId().replace(/[:]/g, "");
  const reduce = useReducedMotion();
  const animate = mode !== "static" && !reduce;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      className={cn("shrink-0", className)}
      role="img"
      aria-label="Aetheria"
    >
      <defs>
        <linearGradient id={`aurora-${gid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--aurora-teal)" />
          <stop offset="52%" stopColor="var(--aurora-violet)" />
          <stop offset="100%" stopColor="var(--aurora-magenta)" />
        </linearGradient>
        <filter id={`glow-${gid}`} x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Expanding ping: a scaled group so no SVG geometry attribute animates. */}
      <motion.g
        style={{ transformOrigin: "80px 80px" }}
        initial={{ scale: 0.3, opacity: 0 }}
        animate={animate ? { scale: [0.3, 2.4], opacity: [0.45, 0] } : { opacity: 0 }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut" }}
      >
        <circle cx="80" cy="80" r="30" fill="none" stroke={`url(#aurora-${gid})`} strokeWidth="2" />
      </motion.g>

      <g fill="none" stroke={`url(#aurora-${gid})`} strokeLinecap="round" filter={`url(#glow-${gid})`}>
        {ARCS.map((arc, i) => (
          <motion.path
            key={i}
            d={arc.d}
            strokeWidth={arc.width}
            strokeDasharray={mode === "trace" ? 240 : undefined}
            initial={
              mode === "trace"
                ? { strokeDashoffset: 240, opacity: arc.base }
                : { opacity: arc.base }
            }
            animate={
              mode === "trace"
                ? { strokeDashoffset: 0, opacity: arc.base }
                : animate
                  ? { opacity: [arc.base * 0.5, arc.base, arc.base * 0.5] }
                  : { opacity: arc.base }
            }
            transition={
              mode === "trace"
                ? { duration: 0.85, delay: i * 0.18, ease: [0.16, 1, 0.3, 1] }
                : { duration: 3, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }
            }
          />
        ))}
      </g>

      <motion.g
        style={{ transformOrigin: "80px 80px" }}
        animate={animate ? { scale: [1, 1.18, 1] } : undefined}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <circle cx="80" cy="80" r="8" fill="var(--aurora-gold)" filter={`url(#glow-${gid})`} />
      </motion.g>
    </svg>
  );
}

export function AetheriaWordmark({
  size = 40,
  className,
  mode = "idle",
}: AetheriaMarkProps) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <AetheriaMark size={size} mode={mode} />
      <span className="font-display text-[1.35rem] font-semibold tracking-tight text-[var(--foreground)]">
        Aetheria
      </span>
    </span>
  );
}
