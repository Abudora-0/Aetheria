"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  addMonths,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  addDays,
} from "date-fns";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  value: Date | null;
  onChange: (date: Date) => void;
  minDate?: Date;
  className?: string;
  label?: string;
}

// Rough height of the open popup (month grid + time dial + padding). Used to
// decide whether it has room to drop down or needs to open upward instead.
const POPUP_HEIGHT = 380;

/** Date and time picker: a month grid paired with an orrery style 24 hour dial. */
export function DateTimePicker({ value, onChange, minDate, className, label }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<"down" | "up">("down");
  const [view, setView] = useState(() => startOfMonth(value ?? new Date()));
  const rootRef = useRef<HTMLDivElement>(null);
  const current = value ?? new Date();

  function toggleOpen() {
    if (!open) {
      const rect = rootRef.current?.getBoundingClientRect();
      if (rect) {
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        setPlacement(spaceBelow < POPUP_HEIGHT && spaceAbove > spaceBelow ? "up" : "down");
      }
    }
    setOpen((o) => !o);
  }

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(view), { weekStartsOn: 1 });
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [view]);

  function setDatePart(day: Date) {
    const next = new Date(day);
    next.setHours(current.getHours(), current.getMinutes(), 0, 0);
    if (minDate && next < minDate) next.setTime(minDate.getTime());
    onChange(next);
  }

  function setHour(hour: number) {
    const next = new Date(current);
    next.setHours(((hour % 24) + 24) % 24);
    onChange(next);
  }

  function setMinute(minute: number) {
    const next = new Date(current);
    next.setMinutes((minute + 60) % 60);
    onChange(next);
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {label ? (
        <span className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">{label}</span>
      ) : null}
      <button
        type="button"
        onClick={toggleOpen}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raise)] px-3 text-sm transition-colors hover:border-[var(--border-strong)]"
      >
        <span className={cn(value ? "text-[var(--foreground)]" : "text-[var(--faint-foreground)]")}>
          {value ? format(value, "EEE d MMM, HH:mm") : "Pick a date and time"}
        </span>
        <Clock size={15} className="text-[var(--faint-foreground)]" />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: placement === "up" ? 6 : -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: placement === "up" ? 6 : -6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 440, damping: 32 }}
            /* Solid background, not .glass: this floats directly over page
               content with no dimming backdrop, so a translucent panel let
               the text behind it show through. Flips to open upward
               (placement === "up") when there isn't room below it. */
            className={cn(
              "absolute z-50 max-h-[calc(100vh-2rem)] w-[320px] overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-solid)] p-3 shadow-[var(--glow)]",
              placement === "up" ? "bottom-full mb-1.5" : "top-full mt-1.5",
            )}
          >
            <div className="mb-2 flex items-center justify-between">
              <button
                onClick={() => setView((v) => addMonths(v, -1))}
                className="rounded-md p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-medium text-[var(--foreground)]">
                {format(view, "MMMM yyyy")}
              </span>
              <button
                onClick={() => setView((v) => addMonths(v, 1))}
                className="rounded-md p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-0.5 text-center">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <span key={i} className="py-1 text-[0.6rem] font-medium text-[var(--faint-foreground)]">
                  {d}
                </span>
              ))}
              {days.map((day) => {
                const disabled = minDate ? day < addDays(startOfMonth(minDate), -1) : false;
                const selected = isSameDay(day, current);
                return (
                  <button
                    key={day.toISOString()}
                    disabled={disabled}
                    onClick={() => setDatePart(day)}
                    className={cn(
                      "aspect-square rounded-[var(--radius-sm)] text-xs transition-colors disabled:opacity-30",
                      !isSameMonth(day, view) && "text-[var(--faint-foreground)]",
                      selected
                        ? "[background:var(--aurora-gradient)] font-semibold text-[#07080d]"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--bg-sink)] hover:text-[var(--foreground)]",
                    )}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 border-t border-[var(--border)] pt-3">
              <p className="mb-2 text-center text-[0.65rem] text-[var(--faint-foreground)]">Time</p>
              <div className="flex items-center justify-center gap-3 font-mono text-2xl text-[var(--foreground)]">
                <div className="flex flex-col items-center gap-0.5">
                  <button
                    onClick={() => setHour(current.getHours() + 1)}
                    aria-label="Hour up"
                    className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    +
                  </button>
                  <span className="w-9 text-center tabular-nums">
                    {String(current.getHours()).padStart(2, "0")}
                  </span>
                  <button
                    onClick={() => setHour(current.getHours() - 1)}
                    aria-label="Hour down"
                    className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    -
                  </button>
                </div>
                <span className="text-[var(--faint-foreground)]">:</span>
                <div className="flex flex-col items-center gap-0.5">
                  <button
                    onClick={() => setMinute(current.getMinutes() + 5)}
                    aria-label="Minute up"
                    className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    +
                  </button>
                  <span className="w-9 text-center tabular-nums">
                    {String(current.getMinutes()).padStart(2, "0")}
                  </span>
                  <button
                    onClick={() => setMinute(current.getMinutes() - 5)}
                    aria-label="Minute down"
                    className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    -
                  </button>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="mt-3 w-full rounded-[var(--radius-sm)] border border-[var(--border-strong)] py-1.5 text-xs text-[var(--foreground)] hover:bg-[var(--bg-sink)]"
              >
                Done
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
