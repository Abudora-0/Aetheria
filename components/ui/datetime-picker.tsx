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

/** Date and time picker: a month grid paired with an orrery style 24 hour dial. */
export function DateTimePicker({ value, onChange, minDate, className, label }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => startOfMonth(value ?? new Date()));
  const rootRef = useRef<HTMLDivElement>(null);
  const current = value ?? new Date();

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
    next.setHours(hour);
    onChange(next);
  }

  function setMinute(minute: number) {
    const next = new Date(current);
    next.setMinutes((minute + 60) % 60);
    onChange(next);
  }

  const hourAngle = (current.getHours() / 24) * 360;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {label ? (
        <span className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">{label}</span>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
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
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 440, damping: 32 }}
            className="glass absolute z-50 mt-1.5 w-[320px] rounded-[var(--radius-lg)] p-3 shadow-[var(--glow)]"
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

            <div className="mt-3 flex items-center gap-3 border-t border-[var(--border)] pt-3">
              <div className="relative h-24 w-24 shrink-0">
                <svg viewBox="0 0 100 100" className="h-full w-full">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="var(--border)" strokeWidth="1" />
                  {Array.from({ length: 24 }).map((_, h) => {
                    const a = (h / 24) * 2 * Math.PI - Math.PI / 2;
                    const x = 50 + Math.cos(a) * 44;
                    const y = 50 + Math.sin(a) * 44;
                    return (
                      <circle
                        key={h}
                        cx={x}
                        cy={y}
                        r={h % 6 === 0 ? 2 : 1}
                        className="cursor-pointer"
                        fill={h === current.getHours() ? "var(--aurora-teal)" : "var(--faint-foreground)"}
                        onClick={() => setHour(h)}
                      />
                    );
                  })}
                  <motion.line
                    x1="50"
                    y1="50"
                    x2="50"
                    y2="12"
                    stroke="var(--aurora-violet)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    style={{ originX: "50px", originY: "50px" }}
                    animate={{ rotate: hourAngle }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  />
                  <circle cx="50" cy="50" r="2.5" fill="var(--aurora-violet)" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="mb-1 text-[0.65rem] text-[var(--faint-foreground)]">Time</p>
                <div className="flex items-center gap-1.5 font-mono text-lg text-[var(--foreground)]">
                  <span>{String(current.getHours()).padStart(2, "0")}</span>
                  <span className="text-[var(--faint-foreground)]">:</span>
                  <div className="flex flex-col">
                    <button
                      onClick={() => setMinute(current.getMinutes() + 5)}
                      className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    >
                      +
                    </button>
                    <span>{String(current.getMinutes()).padStart(2, "0")}</span>
                    <button
                      onClick={() => setMinute(current.getMinutes() - 5)}
                      className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    >
                      -
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="mt-2 w-full rounded-[var(--radius-sm)] border border-[var(--border-strong)] py-1.5 text-xs text-[var(--foreground)] hover:bg-[var(--bg-sink)]"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
