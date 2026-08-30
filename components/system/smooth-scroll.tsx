"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { useMotionPrefs } from "@/components/system/motion-prefs";

/** Lenis smooth scroll, disabled entirely when reduced motion is requested. */
export function SmoothScroll() {
  const { reduced } = useMotionPrefs();

  useEffect(() => {
    if (reduced) return;
    const lenis = new Lenis({ duration: 1.05, easing: (t) => 1 - Math.pow(1 - t, 3) });
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [reduced]);

  return null;
}
