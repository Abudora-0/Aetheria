import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names without conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Clamp a number into an inclusive range. */
export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Linear interpolation. */
export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Format a number with compact suffixes (1.2K, 3.4M). */
export function compactNumber(value: number, digits = 1) {
  if (!Number.isFinite(value)) return "0";
  const abs = Math.abs(value);
  if (abs < 1000) return String(Math.round(value));
  const units = ["K", "M", "B", "T"];
  const order = Math.min(units.length, Math.floor(Math.log10(abs) / 3));
  const scaled = value / Math.pow(1000, order);
  return `${Number(scaled.toFixed(digits))}${units[order - 1]}`;
}

/** Format a ratio as a percentage string. */
export function percent(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

/** Deterministic pseudo random generator (mulberry32) for reproducible demo data. */
export function seededRandom(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Title case a slug or lowercase label. */
export function titleCase(input: string) {
  return input
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Wait for a number of milliseconds. */
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Stable id for demo entities. */
export function shortId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
