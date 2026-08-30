"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[150] grid place-items-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className={cn(
              "panel relative z-10 w-full max-w-lg overflow-hidden p-6 shadow-[var(--glow)]",
              className,
            )}
          >
            <span className="absolute inset-x-0 top-0 h-px [background:var(--aurora-gradient)]" />
            {title ? (
              <div className="mb-4 pr-8">
                <h3 className="text-lg text-[var(--foreground)]">{title}</h3>
                {description ? (
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">{description}</p>
                ) : null}
              </div>
            ) : null}
            <button
              aria-label="Close dialog"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-md p-1.5 text-[var(--faint-foreground)] transition-colors hover:bg-[var(--bg-raise)] hover:text-[var(--foreground)]"
            >
              <X size={16} />
            </button>
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
