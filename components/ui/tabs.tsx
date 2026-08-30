"use client";

import { motion } from "framer-motion";
import { useId } from "react";
import { cn } from "@/lib/utils";

interface TabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  items: { value: T; label: string; icon?: React.ReactNode }[];
  className?: string;
}

export function Tabs<T extends string>({ value, onChange, items, className }: TabsProps<T>) {
  const layoutId = useId();
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raise)] p-1",
        className,
      )}
      role="tablist"
    >
      {items.map((item) => {
        const isActive = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.value)}
            className={cn(
              "relative inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium transition-colors",
              isActive ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
            )}
          >
            {isActive ? (
              <motion.span
                layoutId={`tab-bg-${layoutId}`}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-[var(--radius-sm)] bg-[var(--bg-sink)]"
              />
            ) : null}
            <span className="relative flex items-center gap-1.5">
              {item.icon}
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
