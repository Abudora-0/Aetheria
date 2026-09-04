import { AetheriaMark } from "@/components/brand/aetheria-mark";

/**
 * Suspense fallback for every /studio/* route. The sidebar shell (the parent
 * layout) stays mounted; only this content area swaps in while the page's
 * data loads, so navigation reads as instant instead of frozen.
 */
export default function StudioLoading() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <div className="flex flex-col items-center gap-3">
        <AetheriaMark size={40} mode="idle" />
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--faint-foreground)]">
          Loading
        </span>
      </div>
    </div>
  );
}
