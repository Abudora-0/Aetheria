"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom";
}

export function Tooltip({ content, children, side = "top" }: TooltipProps) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show ? (
          <motion.span
            initial={{ opacity: 0, y: side === "top" ? 4 : -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.14 }}
            role="tooltip"
            className="glass pointer-events-none absolute left-1/2 z-[120] w-max max-w-[220px] -translate-x-1/2 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-xs text-[var(--foreground)] shadow-[var(--glow)]"
            style={side === "top" ? { bottom: "calc(100% + 8px)" } : { top: "calc(100% + 8px)" }}
          >
            {content}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}
