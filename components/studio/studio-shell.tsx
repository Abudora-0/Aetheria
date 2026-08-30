"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  CalendarClock,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  PenLine,
  Radio,
  Settings,
  Command as CommandIcon,
  Link2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AetheriaMark } from "@/components/brand/aetheria-mark";
import { ThemeToggle } from "@/components/system/theme-toggle";
import { CommandPalette } from "@/components/studio/command-palette";
import { Badge } from "@/components/ui/badge";
import { PLANS, type PlanId } from "@/lib/constants";
import type { SessionUser } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/studio", label: "Overview", icon: LayoutDashboard },
  { href: "/studio/compose", label: "Composer", icon: PenLine },
  { href: "/studio/calendar", label: "The Dial", icon: CalendarClock },
  { href: "/studio/queue", label: "Signal Queue", icon: Radio },
  { href: "/studio/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/studio/accounts", label: "Channels", icon: Link2 },
  { href: "/studio/billing", label: "Billing", icon: CreditCard },
  { href: "/studio/settings", label: "Settings", icon: Settings },
];

export function StudioShell({
  user,
  plan,
  accountCount,
  dataMode,
  children,
}: {
  user: SessionUser;
  plan: PlanId;
  accountCount: number;
  dataMode: "live" | "demo";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function signOut() {
    await fetch("/api/auth/sign-out", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const sidebar = (
    <div className="flex h-full flex-col gap-1 p-3">
      <Link href="/studio" className="mb-4 flex items-center gap-2.5 px-2 py-1">
        <AetheriaMark size={30} />
        <span className="font-display text-lg font-semibold">Aetheria</span>
      </Link>

      <button
        onClick={() => setPaletteOpen(true)}
        className="mb-2 flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 text-xs text-[var(--muted-foreground)] transition-colors hover:border-[var(--border-strong)]"
      >
        <span className="flex items-center gap-2">
          <CommandIcon size={13} /> Quick actions
        </span>
        <kbd className="rounded bg-[var(--bg-sink)] px-1.5 py-0.5 font-mono text-[0.6rem]">⌘K</kbd>
      </button>

      <nav className="flex flex-col gap-0.5">
        {NAV.map((item) => {
          const active =
            item.href === "/studio" ? pathname === "/studio" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 text-sm transition-colors",
                active
                  ? "text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--bg-raise)] hover:text-[var(--foreground)]",
              )}
            >
              {active ? (
                <motion.span
                  layoutId="studio-nav-active"
                  className="absolute inset-0 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg-raise)]"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              ) : null}
              <item.icon size={16} className="relative" />
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <Link
          href="/studio/billing"
          className="block rounded-[var(--radius-md)] border border-[var(--border)] p-3 transition-colors hover:border-[var(--border-strong)]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--muted-foreground)]">Plan</span>
            <Badge tone="var(--aurora-violet)">{PLANS[plan].name}</Badge>
          </div>
          <p className="mt-1.5 text-xs text-[var(--faint-foreground)]">
            {accountCount} / {PLANS[plan].limits.channels} channels connected
          </p>
        </Link>

        <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] p-2">
          <div
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold text-[#07080d]"
            style={{ background: "var(--aurora-gradient)" }}
          >
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-[var(--foreground)]">{user.name}</p>
            <p className="truncate text-[0.65rem] text-[var(--faint-foreground)]">{user.email}</p>
          </div>
          <button
            onClick={signOut}
            aria-label="Sign out"
            className="rounded-md p-1.5 text-[var(--faint-foreground)] hover:text-[var(--danger)]"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative flex min-h-full">
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 border-r border-[var(--border)] bg-[var(--bg-sink)] lg:block">
        {sidebar}
      </aside>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 w-[264px] border-r border-[var(--border)] bg-[var(--bg-sink)] lg:hidden"
            >
              {sidebar}
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--bg)_86%,transparent)] px-4 py-3 backdrop-blur lg:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1.5 text-[var(--muted-foreground)] lg:hidden"
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2 text-xs text-[var(--faint-foreground)]">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: dataMode === "live" ? "var(--aurora-teal)" : "var(--aurora-gold)" }}
            />
            {dataMode === "live" ? "Connected to MongoDB" : "Demo data"}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-9">{children}</main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
