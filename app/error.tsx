"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AetheriaMark } from "@/components/brand/aetheria-mark";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[aetheria] render error", error);
  }, [error]);

  return (
    <div className="grid min-h-[80vh] place-items-center px-6 text-center">
      <div className="flex flex-col items-center gap-5">
        <AetheriaMark size={72} mode="static" />
        <h1 className="text-3xl">The signal dropped</h1>
        <p className="max-w-sm text-[var(--muted-foreground)]">
          Something failed while rendering this view. Try again, and if it keeps happening the
          aether will settle shortly.
        </p>
        {error.digest ? (
          <p className="font-mono text-xs text-[var(--faint-foreground)]">ref {error.digest}</p>
        ) : null}
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="rounded-[var(--radius-md)] [background:var(--aurora-gradient)] px-5 py-2.5 text-sm font-semibold text-[#07080d]"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-[var(--radius-md)] border border-[var(--border-strong)] px-5 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--bg-raise)]"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
