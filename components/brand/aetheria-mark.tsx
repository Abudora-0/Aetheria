"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";
import { cn } from "@/lib/utils";

interface AetheriaMarkProps {
  size?: number;
  className?: string;
  /** "idle" loops the pulse, "trace" ripples the rings outward once, "static" is frozen. */
  mode?: "idle" | "trace" | "static";
}

const RINGS = [
  { r: 22, width: 5, base: 0.85 },
  { r: 38, width: 4, base: 0.46 },
  { r: 54, width: 3.5, base: 0.24 },
];

/**
 * The Aetheria mark: concentric rings rippling out from a solar core, a signal
 * propagating evenly into the aether. Used in the nav (idle), the route loader
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
        initial={{ scale: 0.32, opacity: 0 }}
        animate={animate ? { scale: [0.32, 2.6], opacity: [0.4, 0] } : { opacity: 0 }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
      >
        <circle cx="80" cy="80" r="22" fill="none" stroke={`url(#aurora-${gid})`} strokeWidth="2" />
      </motion.g>

      {RINGS.map((ring, i) => (
        <motion.circle
          key={i}
          cx="80"
          cy="80"
          r={ring.r}
          fill="none"
          stroke={`url(#aurora-${gid})`}
          strokeWidth={ring.width}
          strokeLinecap="round"
          filter={`url(#glow-${gid})`}
          style={{ transformOrigin: "80px 80px" }}
          initial={
            mode === "trace" ? { scale: 0, opacity: 0 } : { scale: 1, opacity: ring.base }
          }
          animate={
            mode === "trace"
              ? { scale: 1, opacity: ring.base }
              : animate
                ? { scale: 1, opacity: [ring.base * 0.55, ring.base, ring.base * 0.55] }
                : { scale: 1, opacity: ring.base }
          }
          transition={
            mode === "trace"
              ? { duration: 0.7, delay: i * 0.16, ease: [0.16, 1, 0.3, 1] }
              : { duration: 3.2, repeat: Infinity, delay: i * 0.35, ease: "easeInOut" }
          }
        />
      ))}

      <motion.g
        style={{ transformOrigin: "80px 80px" }}
        animate={animate ? { scale: [1, 1.16, 1] } : undefined}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <circle cx="80" cy="80" r="7.5" fill="var(--aurora-gold)" filter={`url(#glow-${gid})`} />
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
