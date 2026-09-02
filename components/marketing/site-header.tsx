"use client";

import Link from "next/link";
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AetheriaMark, AetheriaWordmark } from "@/components/brand/aetheria-mark";
import { ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/system/theme-toggle";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#analytics", label: "Analytics" },
  { href: "/#workflow", label: "Workflow" },
  { href: "/pricing", label: "Pricing" },
];

export function SiteHeader() {
  const { scrollY } = useScroll();
  const [condensed, setCondensed] = useState(false);
  const [open, setOpen] = useState(false);
  useMotionValueEvent(scrollY, "change", (v) => setCondensed(v > 24));

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="animate-drop fixed inset-x-0 top-0 z-50 flex justify-center px-3 sm:px-4">
      <div
        className={cn(
          "mt-3 flex w-full max-w-[var(--shell-max)] items-center justify-between rounded-[var(--radius-lg)] px-3 py-2.5 transition-all duration-300 sm:px-4",
          condensed || open ? "glass shadow-[var(--glow)]" : "border border-transparent",
        )}
      >
        <Link
          href="/"
          aria-label="Aetheria home"
          className="transition-transform hover:scale-[1.03]"
          onClick={() => setOpen(false)}
        >
          <AetheriaMark size={38} className="sm:hidden" />
          <AetheriaWordmark size={44} className="hidden sm:flex" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="link-sweep rounded-[var(--radius-sm)] px-3 py-1.5 text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <Link
            href="/sign-in"
            className="hidden rounded-[var(--radius-sm)] px-3 py-1.5 text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)] md:block"
          >
            Sign in
          </Link>
          <span className="hidden sm:inline-flex">
            <ButtonLink href="/sign-up" size="sm">
              Start free
            </ButtonLink>
          </span>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--muted-foreground)] md:hidden"
          >
            {open ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="glass absolute inset-x-3 top-[4.5rem] rounded-[var(--radius-lg)] p-2 shadow-[var(--glow)] md:hidden"
          >
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-[var(--radius-sm)] px-3 py-2.5 text-sm text-[var(--muted-foreground)] transition-colors hover:bg-[var(--bg-raise)] hover:text-[var(--foreground)]"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-1 flex items-center gap-2 border-t border-[var(--border)] p-1.5 pt-2.5">
              <Link
                href="/sign-in"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-[var(--radius-sm)] py-2 text-center text-sm text-[var(--foreground)]"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-[var(--radius-sm)] [background:var(--aurora-gradient)] py-2 text-center text-sm font-semibold text-[#07080d]"
              >
                Start free
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
