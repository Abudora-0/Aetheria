import { describe, expect, it } from "vitest";
import { computeAnalytics } from "@/lib/analytics/service";
import { generateDemoDataset } from "@/lib/demo/generate";

describe("computeAnalytics", () => {
  const data = generateDemoDataset();
  const to = new Date();
  const from = new Date(to.getTime() - 90 * 24 * 60 * 60 * 1000);
  const bundle = computeAnalytics(data.metrics, from, to, 90);

  it("returns a daily growth series covering the window", () => {
    expect(bundle.growth.length).toBe(91);
    expect(bundle.growth.every((p) => typeof p.impressions === "number")).toBe(true);
  });

  it("keeps the moving average within the range of the raw series", () => {
    const maxImpr = Math.max(...bundle.growth.map((p) => p.impressions));
    expect(bundle.growth.every((p) => p.movingAverage <= maxImpr + 1)).toBe(true);
  });

  it("derives an engagement rate between 0 and 1", () => {
    expect(bundle.totals.engagementRate).toBeGreaterThan(0);
    expect(bundle.totals.engagementRate).toBeLessThan(1);
  });

  it("breaks engagement down by connected network", () => {
    expect(bundle.engagementByNetwork.length).toBeGreaterThan(0);
    for (const n of bundle.engagementByNetwork) {
      expect(n.impressions).toBeGreaterThan(0);
      expect(n.engagementRate).toBeGreaterThanOrEqual(0);
    }
  });

  it("surfaces up to three golden windows with valid clock positions", () => {
    expect(bundle.goldenWindows.length).toBeLessThanOrEqual(3);
    for (const w of bundle.goldenWindows) {
      expect(w.day).toBeGreaterThanOrEqual(0);
      expect(w.day).toBeLessThanOrEqual(6);
      expect(w.hour).toBeGreaterThanOrEqual(0);
      expect(w.hour).toBeLessThanOrEqual(23);
    }
  });

  it("builds a monotonic funnel", () => {
    const values = bundle.funnel.map((s) => s.value);
    expect(values[0]).toBeGreaterThanOrEqual(values[1]);
  });
});
