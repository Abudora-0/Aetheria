import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  tone?: string;
  className?: string;
  dot?: boolean;
  pulse?: boolean;
}

export function Badge({ children, tone = "var(--aurora-violet)", className, dot, pulse }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.7rem] font-medium",
        className,
      )}
      style={{
        borderColor: `color-mix(in oklab, ${tone} 40%, transparent)`,
        color: tone,
        background: `color-mix(in oklab, ${tone} 12%, transparent)`,
      }}
    >
      {dot ? (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", pulse && "animate-[aether-pulse_1.6s_ease-in-out_infinite]")}
          style={{ background: tone }}
        />
      ) : null}
      {children}
    </span>
  );
}
