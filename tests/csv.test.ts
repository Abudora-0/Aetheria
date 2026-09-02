import { describe, expect, it } from "vitest";
import { analyticsToCsv } from "@/lib/analytics/csv";
import { computeAnalytics } from "@/lib/analytics/service";
import { generateDemoDataset } from "@/lib/demo/generate";

describe("analyticsToCsv", () => {
  const data = generateDemoDataset();
  const to = new Date();
  const from = new Date(to.getTime() - 90 * 864e5);
  const csv = analyticsToCsv(computeAnalytics(data.metrics, from, to, 90));

  it("has one row per labelled section", () => {
    expect(csv).toContain("Totals");
    expect(csv).toContain("Impression growth");
    expect(csv).toContain("Engagement by network");
    expect(csv).toContain("Timing grid (average engagement rate)");
  });

  it("emits a header row for the growth series", () => {
    expect(csv).toContain("date,impressions,moving_average,growth_rate");
  });

  it("quotes any value containing a comma", () => {
    const rows = csv.split("\n").filter((r) => r.includes(","));
    for (const r of rows) {
      // every field with an unescaped comma outside quotes is a real delimiter
      const quoted = r.match(/"[^"]*"/g)?.join("") ?? "";
      expect(quoted.includes("\n")).toBe(false);
    }
    expect(csv.endsWith("\n")).toBe(true);
  });
});
