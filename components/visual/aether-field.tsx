"use client";

import { useEffect, useRef } from "react";
import { useMotionPrefs } from "@/components/system/motion-prefs";

interface AetherFieldProps {
  density?: number;
  className?: string;
  interactive?: boolean;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  hue: number;
}

const HUES = [172, 258, 322, 45];
const LINK_DIST = 116;
const FRAME_MS = 1000 / 30; // cap at ~30fps, plenty for an ambient field

/**
 * Lightweight 2D particle field. Points drift on a slow current and lean
 * toward the pointer to give the "aether" a sense of depth. Pauses entirely
 * when reduced motion is requested, the tab is hidden, or the canvas is
 * scrolled out of view. Neighbour links use a spatial hash so the cost stays
 * linear in the particle count.
 */
export function AetherField({ density = 0.00009, className, interactive = true }: AetherFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { reduced } = useMotionPrefs();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let raf = 0;
    let running = true;
    let onScreen = true;
    let last = 0;
    let rect = canvas.getBoundingClientRect();
    const pointer = { x: -9999, y: -9999 };
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const isCoarse =
      typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;

    function particleCount() {
      if (reduced) return 0;
      const cap = width < 640 ? 46 : 104;
      return Math.min(cap, Math.floor(width * height * density));
    }

    function seed() {
      particles = Array.from({ length: particleCount() }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        z: 0.2 + Math.random() * 0.8,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        hue: HUES[Math.floor(Math.random() * HUES.length)],
      }));
    }

    function resize() {
      const parent = canvas!.parentElement;
      width = parent?.clientWidth ?? window.innerWidth;
      height = parent?.clientHeight ?? window.innerHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      rect = canvas!.getBoundingClientRect();
      seed();
    }

    function drawLinks() {
      // Spatial hash: bucket particles into LINK_DIST cells, only compare a
      // particle against its own cell and the cell to the right / below.
      const cols = Math.max(1, Math.ceil(width / LINK_DIST));
      const grid = new Map<number, Particle[]>();
      for (const p of particles) {
        const key = Math.floor(p.x / LINK_DIST) + Math.floor(p.y / LINK_DIST) * cols;
        const bucket = grid.get(key);
        if (bucket) bucket.push(p);
        else grid.set(key, [p]);
      }
      const neighbours = [0, 1, cols - 1, cols, cols + 1];
      ctx!.lineWidth = 0.6;
      for (const [key, bucket] of grid) {
        for (const offset of neighbours) {
          const other = offset === 0 ? bucket : grid.get(key + offset);
          if (!other) continue;
          for (let i = 0; i < bucket.length; i++) {
            const a = bucket[i];
            for (let j = offset === 0 ? i + 1 : 0; j < other.length; j++) {
              const b = other[j];
              const d = Math.hypot(a.x - b.x, a.y - b.y);
              if (d < LINK_DIST) {
                ctx!.beginPath();
                ctx!.moveTo(a.x, a.y);
                ctx!.lineTo(b.x, b.y);
                ctx!.strokeStyle = `hsla(258, 70%, 70%, ${(1 - d / LINK_DIST) * 0.08})`;
                ctx!.stroke();
              }
            }
          }
        }
      }
    }

    function tick(now: number) {
      raf = requestAnimationFrame(tick);
      if (!running || !onScreen) return;
      if (now - last < FRAME_MS) return;
      last = now;

      ctx!.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx * p.z;
        p.y += p.vy * p.z;

        if (interactive && !isCoarse) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 140) {
            const force = (1 - dist / 140) * 0.6;
            p.x += (dx / dist) * force;
            p.y += (dy / dist) * force;
          }
        }

        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        const r = p.z * 1.6;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx!.fillStyle = `hsla(${p.hue}, 80%, 68%, ${0.14 + p.z * 0.24})`;
        ctx!.fill();
      }

      drawLinks();
    }

    let pointerRaf = 0;
    function onPointerMove(e: PointerEvent) {
      if (pointerRaf) return;
      pointerRaf = requestAnimationFrame(() => {
        pointerRaf = 0;
        pointer.x = e.clientX - rect.left;
        pointer.y = e.clientY - rect.top;
      });
    }
    function onPointerLeave() {
      pointer.x = -9999;
      pointer.y = -9999;
    }
    function onVisibility() {
      running = !document.hidden && !reduced;
    }
    function onScroll() {
      rect = canvas!.getBoundingClientRect();
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
      },
      { rootMargin: "120px" },
    );
    io.observe(canvas);

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });
    if (interactive && !isCoarse) {
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerleave", onPointerLeave);
    }
    document.addEventListener("visibilitychange", onVisibility);

    if (!reduced) raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      if (pointerRaf) cancelAnimationFrame(pointerRaf);
      io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [density, interactive, reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className ?? "pointer-events-none absolute inset-0 h-full w-full"}
    />
  );
}
