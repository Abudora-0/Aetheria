"use client";

import { motion } from "framer-motion";
import { Odometer } from "@/components/ui/odometer";
import { Sparkline } from "@/components/charts/sparkline";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl md:text-[1.7rem]">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-xl text-sm text-[var(--muted-foreground)]">{description}</p>
        ) : null}
      </motion.div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function StatTile({
  label,
  value,
  format = "compact",
  suffix,
  spark,
  delta,
}: {
  label: string;
  value: number;
  format?: "compact" | "plain" | "decimal" | "percent";
  suffix?: string;
  spark?: number[];
  delta?: number;
}) {
  return (
    <div className="panel p-4">
      <p className="text-xs text-[var(--faint-foreground)]">{label}</p>
      <div className="mt-1 flex items-end justify-between">
        <span className="font-display text-2xl font-semibold text-[var(--foreground)]">
          <Odometer value={value} format={format} suffix={suffix} />
        </span>
        {spark ? <Sparkline data={spark} width={72} height={26} /> : null}
      </div>
      {typeof delta === "number" ? (
        <p
          className={cn(
            "mt-1 text-xs",
            delta >= 0 ? "text-[var(--aurora-teal)]" : "text-[var(--danger)]",
          )}
        >
          {delta >= 0 ? "+" : ""}
          {(delta * 100).toFixed(1)}% vs previous period
        </p>
      ) : null}
    </div>
  );
}

export function SectionCard({
  title,
  children,
  className,
  action,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={cn("panel p-5", className)}>
      {title || action ? (
        <div className="mb-4 flex items-center justify-between">
          {title ? (
            <h2 className="text-sm font-medium text-[var(--muted-foreground)]">{title}</h2>
          ) : (
            <span />
          )}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}
