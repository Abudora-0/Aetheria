"use client";

import Link from "next/link";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import { AetheriaWordmark } from "@/components/brand/aetheria-mark";
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
  useMotionValueEvent(scrollY, "change", (v) => setCondensed(v > 24));

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4"
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className={cn(
          "mt-3 flex w-full max-w-[var(--shell-max)] items-center justify-between rounded-[var(--radius-lg)] px-4 py-2.5 transition-all duration-300",
          condensed ? "glass shadow-[var(--glow)]" : "border border-transparent",
        )}
      >
        <Link href="/" aria-label="Aetheria home">
          <AetheriaWordmark size={34} />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-[var(--radius-sm)] px-3 py-1.5 text-sm text-[var(--muted-foreground)] transition-colors hover:bg-[var(--bg-raise)] hover:text-[var(--foreground)]"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/sign-in"
            className="hidden rounded-[var(--radius-sm)] px-3 py-1.5 text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)] sm:block"
          >
            Sign in
          </Link>
          <ButtonLink href="/sign-up" size="sm">
            Start free
          </ButtonLink>
        </div>
      </div>
    </motion.header>
  );
}
