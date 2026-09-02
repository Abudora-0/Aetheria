import type { ReactNode } from "react";
import { AuroraBackdrop } from "@/components/visual/aurora-backdrop";

interface LegalPageProps {
  title: string;
  updated: string;
  intro: string;
  children: ReactNode;
}

/** Shared shell for the privacy policy and terms pages: centered prose column
 *  on the marketing background, with a light heading rhythm. */
export function LegalPage({ title, updated, intro, children }: LegalPageProps) {
  return (
    <div className="relative px-6 pb-28 pt-36">
      <AuroraBackdrop subtle />
      <article className="relative z-10 mx-auto max-w-2xl">
        <h1 className="text-4xl md:text-5xl">{title}</h1>
        <p className="mt-3 text-sm text-[var(--faint-foreground)]">Last updated {updated}</p>
        <p className="mt-6 text-lg text-[var(--muted-foreground)]">{intro}</p>
        <div className="legal-prose mt-10 space-y-8">{children}</div>
      </article>
    </div>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl">{heading}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-[var(--muted-foreground)]">{children}</div>
    </section>
  );
}
