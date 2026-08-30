"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
  id?: string;
}

/** Toggle with an aether trail that follows the thumb. */
export function Switch({ checked, onChange, label, className, id }: SwitchProps) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2.5", className)} htmlFor={id}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 rounded-full border transition-colors duration-300",
          checked
            ? "border-transparent [background:var(--aurora-gradient)]"
            : "border-[var(--border-strong)] bg-[var(--bg-raise)]",
        )}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 560, damping: 34 }}
          className={cn(
            "absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow-md",
            checked ? "right-1" : "left-1",
          )}
        />
      </button>
      {label ? <span className="text-sm text-[var(--muted-foreground)]">{label}</span> : null}
    </label>
  );
}
