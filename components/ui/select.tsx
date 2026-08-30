"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  hint?: string;
  swatch?: string;
}

interface SelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  className?: string;
  label?: string;
}

/** Glass dropdown with a spring reveal and an aurora focus ring. */
export function Select<T extends string>({
  value,
  onChange,
  options,
  placeholder = "Select",
  className,
  label,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (open) {
      const idx = options.findIndex((o) => o.value === value);
      setActive(idx < 0 ? 0 : idx);
    }
  }, [open, options, value]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "Escape") setOpen(false);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(options.length - 1, a + 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      onChange(options[active].value);
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {label ? (
        <span className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">{label}</span>
      ) : null}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raise)] px-3 text-sm text-[var(--foreground)] transition-colors hover:border-[var(--border-strong)]"
      >
        <span className="flex items-center gap-2 truncate">
          {selected?.swatch ? (
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: selected.swatch }}
            />
          ) : null}
          <span className={cn(!selected && "text-[var(--faint-foreground)]")}>
            {selected?.label ?? placeholder}
          </span>
        </span>
        <ChevronsUpDown size={15} className="text-[var(--faint-foreground)]" />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.ul
            id={listId}
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 460, damping: 32 }}
            className="glass absolute z-50 mt-1.5 max-h-64 w-full overflow-auto rounded-[var(--radius-md)] p-1 shadow-[var(--glow)]"
          >
            {options.map((o, i) => {
              const isSelected = o.value === value;
              return (
                <li
                  key={o.value}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm transition-colors",
                    i === active ? "bg-[var(--bg-sink)] text-[var(--foreground)]" : "text-[var(--muted-foreground)]",
                  )}
                >
                  <span className="flex items-center gap-2 truncate">
                    {o.swatch ? (
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: o.swatch }} />
                    ) : null}
                    <span className="truncate">{o.label}</span>
                    {o.hint ? (
                      <span className="text-xs text-[var(--faint-foreground)]">{o.hint}</span>
                    ) : null}
                  </span>
                  {isSelected ? <Check size={14} className="text-[var(--aurora-teal)]" /> : null}
                </li>
              );
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
