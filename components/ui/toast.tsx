"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type ToastTone = "success" | "error" | "info";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  push: (t: Omit<ToastItem, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS = {
  success: CheckCircle2,
  error: TriangleAlert,
  info: Info,
} as const;

const TONE_COLOR: Record<ToastTone, string> = {
  success: "var(--aurora-teal)",
  error: "var(--danger)",
  info: "var(--aurora-violet)",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const push = useCallback(
    (t: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).slice(2);
      setItems((prev) => [...prev.slice(-3), { ...t, id }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), 4600),
      );
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      push,
      success: (title, description) => push({ tone: "success", title, description }),
      error: (title, description) => push({ tone: "error", title, description }),
      info: (title, description) => push({ tone: "info", title, description }),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[200] flex w-[min(360px,calc(100vw-2.5rem))] flex-col gap-2.5">
        <AnimatePresence initial={false}>
          {items.map((t) => {
            const Icon = ICONS[t.tone];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 40, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="glass pointer-events-auto relative overflow-hidden rounded-[var(--radius-md)] p-3.5 pr-9 shadow-[var(--glow)]"
              >
                <span
                  className="absolute inset-y-0 left-0 w-[3px]"
                  style={{ background: TONE_COLOR[t.tone] }}
                />
                <div className="flex gap-3">
                  <Icon size={18} style={{ color: TONE_COLOR[t.tone] }} className="mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)]">{t.title}</p>
                    {t.description ? (
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{t.description}</p>
                    ) : null}
                  </div>
                </div>
                <button
                  aria-label="Dismiss notification"
                  onClick={() => dismiss(t.id)}
                  className="absolute right-2 top-2 rounded-md p-1 text-[var(--faint-foreground)] transition-colors hover:text-[var(--foreground)]"
                >
                  <X size={14} />
                </button>
                <motion.span
                  className="absolute bottom-0 left-0 h-[2px]"
                  style={{ background: TONE_COLOR[t.tone] }}
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 4.6, ease: "linear" }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
