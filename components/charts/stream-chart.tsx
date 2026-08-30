"use client";

import { motion } from "framer-motion";
import { scaleLinear } from "d3-scale";
import { area, curveBasis, line } from "d3-shape";
import { useId, useMemo, useState } from "react";
import { compactNumber } from "@/lib/utils";

interface StreamChartProps {
  data: { date: string; impressions: number; movingAverage: number }[];
  height?: number;
  className?: string;
}

/** Aurora area chart with an animated path draw-in and a hover crosshair. */
export function StreamChart({ data, height = 240, className }: StreamChartProps) {
  const gid = useId().replace(/[:]/g, "");
  const [hover, setHover] = useState<number | null>(null);
  const width = 720;
  const pad = { top: 16, right: 12, bottom: 22, left: 8 };

  const { areaPath, linePath, x, y, maxV } = useMemo(() => {
    const maxV = Math.max(1, ...data.map((d) => Math.max(d.impressions, d.movingAverage)));
    const x = scaleLinear()
      .domain([0, Math.max(1, data.length - 1)])
      .range([pad.left, width - pad.right]);
    const y = scaleLinear().domain([0, maxV]).range([height - pad.bottom, pad.top]);

    const areaGen = area<(typeof data)[number]>()
      .x((_, i) => x(i))
      .y0(height - pad.bottom)
      .y1((d) => y(d.impressions))
      .curve(curveBasis);
    const lineGen = line<(typeof data)[number]>()
      .x((_, i) => x(i))
      .y((d) => y(d.movingAverage))
      .curve(curveBasis);

    return {
      areaPath: areaGen(data) ?? "",
      linePath: lineGen(data) ?? "",
      x,
      y,
      maxV,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, height]);

  const hoverPoint = hover != null ? data[hover] : null;

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const rel = ((e.clientX - rect.left) / rect.width) * width;
          const idx = Math.round(x.invert(rel));
          setHover(Math.max(0, Math.min(data.length - 1, idx)));
        }}
      >
        <defs>
          <linearGradient id={`fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--aurora-violet)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--aurora-violet)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`stroke-${gid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--aurora-teal)" />
            <stop offset="100%" stopColor="var(--aurora-magenta)" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={pad.left}
            x2={width - pad.right}
            y1={y(maxV * t)}
            y2={y(maxV * t)}
            stroke="var(--border)"
            strokeDasharray="2 4"
          />
        ))}

        <motion.path
          d={areaPath}
          fill={`url(#fill-${gid})`}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        />
        <motion.path
          d={linePath}
          fill="none"
          stroke={`url(#stroke-${gid})`}
          strokeWidth={2.5}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        />

        {hoverPoint ? (
          <g>
            <line
              x1={x(hover!)}
              x2={x(hover!)}
              y1={pad.top}
              y2={height - pad.bottom}
              stroke="var(--aurora-gold)"
              strokeOpacity={0.5}
            />
            <circle cx={x(hover!)} cy={y(hoverPoint.impressions)} r={4} fill="var(--aurora-gold)" />
          </g>
        ) : null}
      </svg>

      <div className="mt-1 flex items-center justify-between text-xs text-[var(--faint-foreground)]">
        <span>{data[0]?.date}</span>
        {hoverPoint ? (
          <span className="font-mono text-[var(--foreground)]">
            {hoverPoint.date} &middot; {compactNumber(hoverPoint.impressions)} impressions
          </span>
        ) : (
          <span>7 day moving average</span>
        )}
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}
