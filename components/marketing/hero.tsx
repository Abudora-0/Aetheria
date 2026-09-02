"use client";

import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight, ChevronDown, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import { AetheriaMark } from "@/components/brand/aetheria-mark";
import { AetherField } from "@/components/visual/aether-field";
import { AuroraBackdrop } from "@/components/visual/aurora-backdrop";
import { ButtonLink } from "@/components/ui/button";
import { Odometer } from "@/components/ui/odometer";
import { NETWORK_LIST } from "@/lib/constants";
import { useMotionPrefs } from "@/components/system/motion-prefs";

const stat = [
  { label: "Signals published", value: 2_480_000, format: "compact" as const },
  { label: "Median time saved weekly", value: 6.4, format: "decimal" as const, suffix: "h" },
  { label: "Avg engagement lift", value: 31, format: "percent" as const },
];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { reduced } = useMotionPrefs();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const markScroll = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -90]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.06], [1, 0]);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 120, damping: 20 });
  const sy = useSpring(py, { stiffness: 120, damping: 20 });

  // Cache the section rect so pointer moves never read layout, and coalesce
  // updates to one per frame. Skipped entirely on touch / reduced motion.
  const rectRef = useRef<DOMRect | null>(null);
  const frameRef = useRef(0);
  useEffect(() => {
    if (reduced) return;
    if (window.matchMedia?.("(pointer: coarse)").matches) return;
    const sync = () => {
      rectRef.current = ref.current?.getBoundingClientRect() ?? null;
    };
    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, { passive: true });
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [reduced]);

  function onPointerMove(e: React.PointerEvent) {
    if (reduced || frameRef.current) return;
    const clientX = e.clientX;
    const clientY = e.clientY;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      const r = rectRef.current;
      if (!r) return;
      px.set(((clientX - r.left) / r.width - 0.5) * 26);
      py.set(((clientY - r.top) / r.height - 0.5) * 26);
    });
  }

  return (
    <section
      ref={ref}
      onPointerMove={onPointerMove}
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 pt-24 sm:px-6 sm:pt-28"
    >
      <AuroraBackdrop />
      <AetherField className="pointer-events-none absolute inset-0 h-full w-full opacity-70" />

      <motion.div style={{ x: sx, y: markScroll }} className="animate-rise relative z-10">
        <motion.div style={{ y: sy }}>
          <AetheriaMark size={112} mode="trace" className="h-[92px] w-[92px] sm:h-28 sm:w-28" />
        </motion.div>
      </motion.div>

      <div className="relative z-10 mt-8 flex max-w-3xl flex-col items-center text-center">
        <span
          className="glass animate-rise mb-6 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs text-[var(--muted-foreground)]"
          style={{ animationDelay: "80ms" }}
        >
          <Sparkles size={13} className="text-[var(--aurora-gold)]" />
          Scheduling worker, OAuth refresh and analytics in one suite
        </span>

        <h1
          className="animate-rise text-balance text-[2.4rem] leading-[1.06] sm:text-6xl md:text-7xl"
          style={{ animationDelay: "150ms" }}
        >
          Send your words into the{" "}
          <span
            className="aurora-text bg-[length:200%_auto]"
            style={reduced ? undefined : { animation: "aether-shimmer 6s linear infinite" }}
          >
            aether
          </span>
          , on schedule.
        </h1>

        <p
          className="animate-rise mt-6 max-w-xl text-base text-[var(--muted-foreground)] sm:text-lg"
          style={{ animationDelay: "220ms" }}
        >
          Aetheria drafts, schedules and auto publishes across every network, then reads the
          impression curves so you know exactly when to post next.
        </p>

        <div
          className="animate-rise mt-9 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center"
          style={{ animationDelay: "290ms" }}
        >
          <ButtonLink href="/sign-up" size="lg" className="justify-center">
            Start free <ArrowRight size={16} />
          </ButtonLink>
          <ButtonLink
            href="/sign-in"
            size="lg"
            variant="outline"
            magnetic={false}
            className="justify-center"
          >
            Explore the demo
          </ButtonLink>
        </div>
      </div>

      <div
        className="animate-rise relative z-10 mt-16 grid w-full max-w-3xl grid-cols-1 gap-px overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3"
        style={{ animationDelay: "400ms" }}
      >
        {stat.map((s) => (
          <div key={s.label} className="bg-[var(--bg-raise)] p-5 text-center">
            <div className="font-display text-2xl font-semibold text-[var(--foreground)]">
              <Odometer value={s.value} format={s.format} suffix={s.suffix} />
            </div>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">{s.label}</p>
          </div>
        ))}
      </div>

      <div
        className="animate-rise relative z-10 mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[var(--faint-foreground)]"
        style={{ animationDelay: "480ms" }}
      >
        <span className="text-xs uppercase tracking-widest">Publishes to</span>
        {NETWORK_LIST.map((n) => (
          <span key={n.id} className="flex items-center gap-1.5 text-sm">
            <n.icon size={16} style={{ color: n.accent }} />
            {n.name}
          </span>
        ))}
      </div>

      <motion.div
        style={{ opacity: cueOpacity }}
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-[var(--faint-foreground)]"
        aria-hidden
      >
        <motion.div
          animate={reduced ? undefined : { y: [0, 7, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={20} />
        </motion.div>
      </motion.div>
    </section>
  );
}
