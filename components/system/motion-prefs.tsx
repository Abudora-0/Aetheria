"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

interface MotionPrefsValue {
  reduced: boolean;
  systemReduced: boolean;
  setReduced: (v: boolean) => void;
}

const MotionPrefsContext = createContext<MotionPrefsValue | null>(null);
const STORAGE_KEY = "aetheria-reduce-motion";

export function MotionPrefsProvider({ children }: { children: React.ReactNode }) {
  const [systemReduced, setSystemReduced] = useState(false);
  const [override, setOverride] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setSystemReduced(mq.matches);
    const onChange = () => setSystemReduced(mq.matches);
    mq.addEventListener("change", onChange);

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored != null) setOverride(stored === "true");
    } catch {
      /* ignore */
    }
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const reduced = override ?? systemReduced;

  useEffect(() => {
    document.documentElement.setAttribute("data-reduce-motion", String(reduced));
  }, [reduced]);

  const value = useMemo<MotionPrefsValue>(
    () => ({
      reduced,
      systemReduced,
      setReduced: (v: boolean) => {
        setOverride(v);
        try {
          localStorage.setItem(STORAGE_KEY, String(v));
        } catch {
          /* ignore */
        }
      },
    }),
    [reduced, systemReduced],
  );

  return <MotionPrefsContext.Provider value={value}>{children}</MotionPrefsContext.Provider>;
}

export function useMotionPrefs() {
  const ctx = useContext(MotionPrefsContext);
  if (!ctx) throw new Error("useMotionPrefs must be used within MotionPrefsProvider");
  return ctx;
}
