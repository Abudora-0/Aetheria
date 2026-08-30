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

/**
 * Lightweight 2D particle field. Points drift on a slow current and lean
 * toward the pointer to give the "aether" a sense of depth. Pauses entirely
 * when reduced motion is requested or the tab is hidden.
 */
export function AetherField({ density = 0.00012, className, interactive = true }: AetherFieldProps) {
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
    const pointer = { x: -9999, y: -9999 };
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    function seed() {
      const count = reduced ? 0 : Math.min(160, Math.floor(width * height * density));
      particles = Array.from({ length: count }, () => ({
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
      seed();
    }

    function tick() {
      if (!running) return;
      ctx!.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx * p.z;
        p.y += p.vy * p.z;

        if (interactive) {
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

      // Constellation links
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 120) {
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.strokeStyle = `hsla(258, 70%, 70%, ${(1 - d / 120) * 0.08})`;
            ctx!.lineWidth = 0.6;
            ctx!.stroke();
          }
        }
      }

      raf = requestAnimationFrame(tick);
    }

    function onPointerMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    }
    function onPointerLeave() {
      pointer.x = -9999;
      pointer.y = -9999;
    }
    function onVisibility() {
      running = !document.hidden && !reduced;
      if (running) tick();
      else cancelAnimationFrame(raf);
    }

    resize();
    window.addEventListener("resize", resize);
    if (interactive) {
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerleave", onPointerLeave);
    }
    document.addEventListener("visibilitychange", onVisibility);

    if (!reduced) tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
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
