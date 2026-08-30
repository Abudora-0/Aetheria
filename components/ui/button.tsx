"use client";

import { motion, useMotionValue, useSpring, type HTMLMotionProps } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import { useMotionPrefs } from "@/components/system/motion-prefs";

type Variant = "primary" | "ghost" | "outline" | "solid" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "text-[#07080d] font-semibold [background:var(--aurora-gradient)] hover:brightness-110 shadow-[0_10px_40px_-12px_rgba(139,92,246,0.6)]",
  solid:
    "bg-[var(--foreground)] text-[var(--bg)] font-semibold hover:opacity-90",
  outline:
    "border border-[var(--border-strong)] text-[var(--foreground)] hover:bg-[var(--bg-raise)]",
  ghost: "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--bg-raise)]",
  danger: "bg-[var(--danger)] text-white font-semibold hover:brightness-110",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-[var(--radius-sm)]",
  md: "h-10 px-4 text-sm rounded-[var(--radius-md)]",
  lg: "h-12 px-6 text-[0.95rem] rounded-[var(--radius-md)]",
};

interface BaseProps {
  variant?: Variant;
  size?: Size;
  magnetic?: boolean;
  className?: string;
  children: React.ReactNode;
}

type ButtonProps = BaseProps &
  Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "children" | "className" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd" | "style"
  >;

function useMagnet(enabled: boolean) {
  const ref = useRef<HTMLElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18 });
  const sy = useSpring(y, { stiffness: 260, damping: 18 });

  const onMove = (e: React.MouseEvent) => {
    if (!enabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.28);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.28);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };
  return { ref, sx, sy, onMove, reset };
}

const BASE =
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap transition-[filter,background-color,color,opacity] duration-200 disabled:pointer-events-none disabled:opacity-45 select-none";

export function Button({
  variant = "primary",
  size = "md",
  magnetic = true,
  className,
  children,
  ...props
}: ButtonProps) {
  const { reduced } = useMotionPrefs();
  const enabled = magnetic && !reduced;
  const { ref, sx, sy, onMove, reset } = useMagnet(enabled);

  return (
    <motion.button
      ref={ref as React.Ref<HTMLButtonElement>}
      style={enabled ? { x: sx, y: sy } : undefined}
      onMouseMove={onMove}
      onMouseLeave={reset}
      whileTap={{ scale: 0.97 }}
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      {...(props as HTMLMotionProps<"button">)}
    >
      {children}
    </motion.button>
  );
}

interface ButtonLinkProps extends BaseProps {
  href: string;
  target?: string;
  rel?: string;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  magnetic = true,
  className,
  children,
  href,
  ...rest
}: ButtonLinkProps) {
  const { reduced } = useMotionPrefs();
  const enabled = magnetic && !reduced;
  const { ref, sx, sy, onMove, reset } = useMagnet(enabled);

  return (
    <motion.span
      ref={ref as React.Ref<HTMLSpanElement>}
      style={enabled ? { x: sx, y: sy } : undefined}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className="inline-flex"
    >
      <Link href={href} className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...rest}>
        {children}
      </Link>
    </motion.span>
  );
}
