"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMotionPrefs } from "@/components/system/motion-prefs";

/**
 * Ambient aurora glow behind content. The soft edge comes from a radial
 * gradient that fades to transparent, not a `blur()` filter, so moving the
 * blobs is a pure compositor transform with no per-frame re-rasterization.
 */
export function AuroraBackdrop({ className, subtle = false }: { className?: string; subtle?: boolean }) {
  const { reduced } = useMotionPrefs();
  const blobs = [
    { color: "var(--aurora-teal)", x: "8%", y: "12%", size: 540, dur: 30 },
    { color: "var(--aurora-violet)", x: "60%", y: "2%", size: 620, dur: 36 },
    { color: "var(--aurora-magenta)", x: "38%", y: "58%", size: 480, dur: 33 },
  ];
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: b.x,
            top: b.y,
            width: b.size,
            height: b.size,
            background: `radial-gradient(circle at center, ${b.color}, transparent 66%)`,
            opacity: subtle ? 0.16 : 0.26,
            willChange: reduced ? undefined : "transform",
          }}
          animate={
            reduced
              ? undefined
              : { x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.08, 0.96, 1] }
          }
          transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
