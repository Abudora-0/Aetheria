"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";
import { cn } from "@/lib/utils";

interface AetheriaMarkProps {
  size?: number;
  className?: string;
  /** "idle" gently loops orbits, "trace" redraws the monogram, "static" is frozen. */
  mode?: "idle" | "trace" | "static";
}

/**
 * The Aetheria mark: an aurora ribbon that traces an "A" monogram while two
 * particles orbit the glyph. Used in the nav (idle), the route loader (trace),
 * and as a still for icons.
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
        <filter id={`glow-${gid}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <motion.circle
        cx="80"
        cy="80"
        r="62"
        fill="none"
        stroke={`url(#aurora-${gid})`}
        strokeOpacity="0.16"
        strokeWidth="1"
        animate={animate ? { rotate: 360 } : undefined}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "80px 80px" }}
      />

      <g
        fill="none"
        stroke={`url(#aurora-${gid})`}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#glow-${gid})`}
      >
        <motion.path
          d="M34 122 L80 30 L126 122"
          strokeDasharray="240"
          initial={mode === "trace" ? { strokeDashoffset: 240 } : { strokeDashoffset: 0 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: mode === "trace" ? 1.8 : 0, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.path
          d="M52 92 L108 92"
          strokeDasharray="60"
          initial={mode === "trace" ? { strokeDashoffset: 60 } : { strokeDashoffset: 0 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: mode === "trace" ? 0.7 : 0, delay: mode === "trace" ? 1.4 : 0 }}
        />
      </g>

      <motion.g
        animate={animate ? { rotate: 360 } : undefined}
        transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "80px 80px" }}
      >
        <circle cx="80" cy="17" r="4" fill="var(--aurora-gold)" filter={`url(#glow-${gid})`} />
      </motion.g>
      <motion.g
        animate={animate ? { rotate: -360 } : undefined}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "80px 80px" }}
      >
        <circle cx="143" cy="80" r="2.6" fill="var(--aurora-teal)" filter={`url(#glow-${gid})`} />
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
