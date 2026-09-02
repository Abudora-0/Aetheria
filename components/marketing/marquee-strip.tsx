"use client";

import { useMotionPrefs } from "@/components/system/motion-prefs";

const ITEMS = [
  "Next.js 16",
  "MongoDB aggregation",
  "Cron publish workers",
  "OAuth 2.0 with PKCE",
  "AES-256-GCM token vault",
  "Stripe webhooks",
  "Cloudinary media",
  "Framer Motion",
  "d3 charts",
  "Vitest + CI",
];

export function MarqueeStrip() {
  const { reduced } = useMotionPrefs();

  const row = (
    <ul className="flex shrink-0 items-center gap-10 pr-10" aria-hidden>
      {ITEMS.map((item) => (
        <li key={item} className="flex items-center gap-3 whitespace-nowrap text-sm text-[var(--faint-foreground)]">
          <span className="h-1 w-1 rounded-full bg-[var(--aurora-violet)]" />
          {item}
        </li>
      ))}
    </ul>
  );

  return (
    <section className="relative z-10 border-y border-[var(--border)] py-5">
      {reduced ? (
        <div className="mx-auto flex max-w-[var(--shell-max)] flex-wrap justify-center gap-x-8 gap-y-2 px-6">
          {ITEMS.map((item) => (
            <span key={item} className="text-sm text-[var(--faint-foreground)]">
              {item}
            </span>
          ))}
        </div>
      ) : (
        <div className="marquee-mask overflow-hidden">
          <div className="marquee-track flex w-max hover:[animation-play-state:paused]">
            {row}
            {row}
          </div>
        </div>
      )}
    </section>
  );
}
