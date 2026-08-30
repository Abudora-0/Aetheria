"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  CalendarClock,
  CreditCard,
  LayoutDashboard,
  Link2,
  PenLine,
  Radio,
  Settings,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

interface Action {
  label: string;
  hint: string;
  icon: React.ElementType;
  run: () => void;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const actions = useMemo<Action[]>(() => {
    const go = (href: string) => () => {
      router.push(href);
      onClose();
    };
    return [
      { label: "Go to Overview", hint: "dashboard", icon: LayoutDashboard, run: go("/studio") },
      { label: "New draft", hint: "composer", icon: PenLine, run: go("/studio/compose") },
      { label: "Open The Dial", hint: "calendar", icon: CalendarClock, run: go("/studio/calendar") },
      { label: "Signal Queue", hint: "scheduled jobs", icon: Radio, run: go("/studio/queue") },
      { label: "Analytics", hint: "impressions and timing", icon: BarChart3, run: go("/studio/analytics") },
      { label: "Connect a channel", hint: "oauth", icon: Link2, run: go("/studio/accounts") },
      { label: "Billing and plan", hint: "stripe", icon: CreditCard, run: go("/studio/billing") },
      { label: "Settings", hint: "profile and motion", icon: Settings, run: go("/studio/settings") },
    ];
  }, [router, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter((a) => `${a.label} ${a.hint}`.toLowerCase().includes(q));
  }, [actions, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);

  useEffect(() => setActive(0), [query]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[160] flex items-start justify-center px-4 pt-[12vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="glass relative z-10 w-full max-w-lg overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--glow)]"
          >
            <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-4 py-3">
              <Sparkles size={15} className="text-[var(--aurora-gold)]" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActive((a) => Math.min(filtered.length - 1, a + 1));
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActive((a) => Math.max(0, a - 1));
                  }
                  if (e.key === "Enter") {
                    e.preventDefault();
                    filtered[active]?.run();
                  }
                  if (e.key === "Escape") onClose();
                }}
                placeholder="Type a command or search"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--faint-foreground)]"
              />
              <kbd className="rounded bg-[var(--bg-sink)] px-1.5 py-0.5 font-mono text-[0.6rem] text-[var(--faint-foreground)]">
                esc
              </kbd>
            </div>
            <ul className="max-h-[320px] overflow-auto p-1.5">
              {filtered.map((a, i) => (
                <li key={a.label}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => a.run()}
                    className={`flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-left text-sm transition-colors ${
                      i === active ? "bg-[var(--bg-raise)] text-[var(--foreground)]" : "text-[var(--muted-foreground)]"
                    }`}
                  >
                    <a.icon size={15} />
                    <span className="flex-1">{a.label}</span>
                    <span className="text-xs text-[var(--faint-foreground)]">{a.hint}</span>
                  </button>
                </li>
              ))}
              {filtered.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-[var(--faint-foreground)]">
                  Nothing matches that
                </li>
              ) : null}
            </ul>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
