import Link from "next/link";
import { AetheriaMark } from "@/components/brand/aetheria-mark";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Analytics", href: "/#analytics" },
      { label: "Pricing", href: "/pricing" },
      { label: "Changelog", href: "/#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "/#" },
      { label: "API status", href: "/#" },
      { label: "Guides", href: "/#" },
      { label: "Community", href: "/#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/#" },
      { label: "Careers", href: "/#" },
      { label: "Privacy", href: "/#" },
      { label: "Terms", href: "/#" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-[var(--border)] bg-[var(--bg-sink)]">
      <div className="mx-auto grid max-w-[var(--shell-max)] gap-10 px-6 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <div className="flex items-center gap-2.5">
            <AetheriaMark size={30} mode="static" />
            <span className="font-display text-lg font-semibold">Aetheria</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-[var(--muted-foreground)]">
            Draft once, publish everywhere, and learn what the numbers are quietly telling you.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--faint-foreground)]">
              {col.title}
            </h4>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-[var(--border)] px-6 py-5">
        <div className="mx-auto flex max-w-[var(--shell-max)] flex-col items-center justify-between gap-2 text-xs text-[var(--faint-foreground)] sm:flex-row">
          <span>Built for creators who move fast. MIT licensed.</span>
          <span>&copy; {new Date().getFullYear()} Aetheria</span>
        </div>
      </div>
    </footer>
  );
}
