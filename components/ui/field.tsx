import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const inputBase =
  "h-10 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raise)] px-3 text-sm text-[var(--foreground)] transition-colors placeholder:text-[var(--faint-foreground)] hover:border-[var(--border-strong)] focus-visible:border-[var(--aurora-violet)]";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(inputBase, className)} {...props} />;
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        inputBase,
        "min-h-[120px] resize-y py-2.5 leading-relaxed",
        className,
      )}
      {...props}
    />
  );
});

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      {label ? (
        <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-[var(--muted-foreground)]">
          {label}
          {hint ? <span className="text-[var(--faint-foreground)]">{hint}</span> : null}
        </span>
      ) : null}
      {children}
      {error ? <span className="mt-1 block text-xs text-[var(--danger)]">{error}</span> : null}
    </label>
  );
}
