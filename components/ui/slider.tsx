"use client";

import { useCallback, useRef } from "react";
import { clamp, cn } from "@/lib/utils";

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  suffix?: string;
  className?: string;
}

/** Range control with a glowing aurora fill and a spring thumb. */
export function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  label,
  suffix,
  className,
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pct = ((clamp(value, min, max) - min) / (max - min)) * 100;

  const setFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      const raw = min + ratio * (max - min);
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(6)), min, max));
    },
    [min, max, step, onChange],
  );

  return (
    <div className={cn("w-full", className)}>
      {label ? (
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-[var(--muted-foreground)]">{label}</span>
          <span className="font-mono text-[var(--foreground)]">
            {value}
            {suffix}
          </span>
        </div>
      ) : null}
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange(clamp(value + step, min, max));
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange(clamp(value - step, min, max));
        }}
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture?.(e.pointerId);
          setFromClientX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) setFromClientX(e.clientX);
        }}
        className="relative h-6 cursor-pointer touch-none select-none"
      >
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[var(--bg-sink)]" />
        <div
          className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full [background:var(--aurora-gradient)]"
          style={{ width: `${pct}%`, boxShadow: "0 0 14px -2px var(--aurora-violet)" }}
        />
        <div
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--aurora-violet)] shadow-[0_0_0_4px_rgba(139,92,246,0.2)] transition-transform"
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  );
}
