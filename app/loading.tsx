import { AetheriaMark } from "@/components/brand/aetheria-mark";

export default function Loading() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="flex flex-col items-center gap-4">
        <AetheriaMark size={64} mode="trace" />
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--faint-foreground)]">
          Aligning the aether
        </span>
      </div>
    </div>
  );
}
