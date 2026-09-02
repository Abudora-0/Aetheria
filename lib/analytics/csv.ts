import { NETWORKS } from "@/lib/constants";
import type { AnalyticsBundle } from "@/lib/types";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function cell(value: string | number) {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function rows(list: (string | number)[][]) {
  return list.map((r) => r.map(cell).join(",")).join("\n");
}

/** Flattens an analytics bundle into one CSV with labelled sections. */
export function analyticsToCsv(bundle: AnalyticsBundle): string {
  const parts: string[] = [];

  parts.push(`Aetheria analytics export`);
  parts.push(`Range,${bundle.range.from},${bundle.range.to},${bundle.range.days} days`);
  parts.push("");

  parts.push("Totals");
  parts.push(
    rows([
      ["Impressions", bundle.totals.impressions],
      ["Engagements", bundle.totals.engagements],
      ["Engagement rate", bundle.totals.engagementRate.toFixed(4)],
      ["Growth rate", bundle.totals.growthRate.toFixed(4)],
      ["Cadence score", bundle.totals.cadenceScore],
      ["Published", bundle.totals.publishedCount],
    ]),
  );
  parts.push("");

  parts.push("Impression growth");
  parts.push("date,impressions,moving_average,growth_rate");
  parts.push(
    rows(
      bundle.growth.map((g) => [g.date, g.impressions, g.movingAverage, g.growthRate.toFixed(4)]),
    ),
  );
  parts.push("");

  parts.push("Engagement by network");
  parts.push("network,impressions,engagements,engagement_rate");
  parts.push(
    rows(
      bundle.engagementByNetwork.map((n) => [
        NETWORKS[n.network as keyof typeof NETWORKS]?.name ?? n.network,
        n.impressions,
        n.engagements,
        n.engagementRate.toFixed(4),
      ]),
    ),
  );
  parts.push("");

  parts.push("Timing grid (average engagement rate)");
  parts.push("day,hour,score,samples");
  parts.push(
    rows(bundle.timing.map((c) => [DAYS[c.day] ?? c.day, c.hour, c.score.toFixed(4), c.samples])),
  );

  return parts.join("\n") + "\n";
}
