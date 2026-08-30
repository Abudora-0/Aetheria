"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMotionPrefs } from "@/components/system/motion-prefs";

/** Ambient aurora blobs that drift behind content. */
export function AuroraBackdrop({ className, subtle = false }: { className?: string; subtle?: boolean }) {
  const { reduced } = useMotionPrefs();
  const blobs = [
    { color: "var(--aurora-teal)", x: "8%", y: "12%", size: 480, dur: 26 },
    { color: "var(--aurora-violet)", x: "62%", y: "4%", size: 560, dur: 32 },
    { color: "var(--aurora-magenta)", x: "38%", y: "58%", size: 420, dur: 29 },
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
            background: b.color,
            filter: "blur(120px)",
            opacity: subtle ? 0.1 : 0.18,
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
