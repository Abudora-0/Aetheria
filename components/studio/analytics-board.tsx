"use client";

import { useEffect, useState } from "react";
import { Database, Download } from "lucide-react";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { StreamChart } from "@/components/charts/stream-chart";
import { TimingHeatmap } from "@/components/charts/timing-heatmap";
import { EngagementFunnel } from "@/components/charts/funnel";
import { StatTile, SectionCard } from "@/components/studio/primitives";
import { NETWORKS } from "@/lib/constants";
import { analyticsToCsv } from "@/lib/analytics/csv";
import type { AnalyticsBundle } from "@/lib/types";
import { percent } from "@/lib/utils";

const RANGES: { value: string; label: string }[] = [
  { value: "30", label: "30d" },
  { value: "60", label: "60d" },
  { value: "90", label: "90d" },
];

export function AnalyticsBoard({
  initial,
  engine,
}: {
  initial: AnalyticsBundle;
  engine: string;
}) {
  const [days, setDays] = useState("90");
  const [bundle, setBundle] = useState(initial);
  const [loading, setLoading] = useState(false);

  function exportCsv() {
    const blob = new Blob([analyticsToCsv(bundle)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aetheria-analytics-${days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    if (days === "90") {
      setBundle(initial);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/analytics?days=${days}`)
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && j.ok) setBundle(j.data);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [days, initial]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={days} onChange={setDays} items={RANGES} />
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 text-xs text-[var(--faint-foreground)] sm:flex">
            <Database size={12} /> {engine}
            {loading ? " . updating" : ""}
          </span>
          <Button size="sm" variant="outline" magnetic={false} onClick={exportCsv}>
            <Download size={13} /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Impressions"
          value={bundle.totals.impressions}
          spark={bundle.velocity}
          delta={bundle.totals.growthRate}
        />
        <StatTile
          label="Engagement rate"
          value={bundle.totals.engagementRate * 100}
          format="percent"
        />
        <StatTile label="Cadence score" value={bundle.totals.cadenceScore} format="plain" />
        <StatTile label="Published" value={bundle.totals.publishedCount} format="plain" />
      </div>

      <SectionCard title="Impression growth with 7 day moving average">
        <StreamChart data={bundle.growth} height={280} />
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Engagement by network">
          <div className="space-y-3">
            {bundle.engagementByNetwork.map((n) => {
              const meta = NETWORKS[n.network as keyof typeof NETWORKS];
              const max = Math.max(...bundle.engagementByNetwork.map((x) => x.engagementRate), 0.001);
              return (
                <div key={n.network}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
                      {meta ? <meta.icon size={12} style={{ color: meta.accent }} /> : null}
                      {meta?.name ?? n.network}
                    </span>
                    <span className="font-mono text-[var(--foreground)]">
                      {percent(n.engagementRate)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-sink)]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(n.engagementRate / max) * 100}%`,
                        background: meta?.accent ?? "var(--aurora-violet)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="Engagement funnel">
          <EngagementFunnel stages={bundle.funnel} />
        </SectionCard>
      </div>

      <SectionCard title="Optimal posting windows, 7 x 24">
        <TimingHeatmap cells={bundle.timing} />
      </SectionCard>
    </div>
  );
}
