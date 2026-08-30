"use client";

import { motion } from "framer-motion";
import { scaleLinear } from "d3-scale";
import { line, curveMonotoneX } from "d3-shape";
import { useId } from "react";

export function Sparkline({
  data,
  width = 120,
  height = 36,
  stroke = "var(--aurora-teal)",
}: {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
}) {
  const gid = useId().replace(/[:]/g, "");
  if (data.length < 2) return <svg width={width} height={height} />;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const x = scaleLinear().domain([0, data.length - 1]).range([1, width - 1]);
  const y = scaleLinear().domain([min, max === min ? min + 1 : max]).range([height - 2, 2]);
  const path = line<number>().x((_, i) => x(i)).y((d) => y(d)).curve(curveMonotoneX)(data) ?? "";

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`sp-${gid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.3" />
          <stop offset="100%" stopColor={stroke} />
        </linearGradient>
      </defs>
      <motion.path
        d={path}
        fill="none"
        stroke={`url(#sp-${gid})`}
        strokeWidth={1.75}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
      <circle cx={x(data.length - 1)} cy={y(data[data.length - 1])} r={2.5} fill={stroke} />
    </svg>
  );
}
