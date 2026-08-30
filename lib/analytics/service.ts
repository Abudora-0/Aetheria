import { NETWORK_LIST, type NetworkId } from "@/lib/constants";
import { resolveDataMode } from "@/lib/env";
import { getData } from "@/lib/data";
import type {
  AnalyticsBundle,
  EngagementSummary,
  GrowthSeriesPoint,
  MetricPoint,
  TimingCell,
} from "@/lib/types";

const DAY = 24 * 60 * 60 * 1000;

export async function getAnalytics(
  userId: string,
  days = 90,
  timezone = "America/New_York",
): Promise<AnalyticsBundle> {
  const to = new Date();
  const from = new Date(to.getTime() - days * DAY);

  if (resolveDataMode() === "live") {
    try {
      return await liveAnalytics(userId, from, to, days, timezone);
    } catch (err) {
      console.error("[aetheria] live analytics failed, falling back", err);
    }
  }

  const data = await getData();
  const metrics = await data.metrics.forUser(userId, from.toISOString());
  return computeAnalytics(metrics, from, to, days);
}

/* -------------------------------------------------------------------------- */
/*  Live: run the aggregation pipelines                                        */
/* -------------------------------------------------------------------------- */

async function liveAnalytics(
  userId: string,
  from: Date,
  to: Date,
  days: number,
  timezone: string,
): Promise<AnalyticsBundle> {
  const { Metric } = await import("@/models");
  const { mongoose } = await import("@/models");
  const {
    impressionGrowthPipeline,
    engagementPipeline,
    timingHeatmapPipeline,
    cadencePipeline,
  } = await import("@/lib/analytics/pipelines");

  const ctx = { userId: new mongoose.Types.ObjectId(userId), from, to, timezone };

  const [growthRaw, engagementRaw, timingRaw, cadenceRaw] = await Promise.all([
    Metric.aggregate(impressionGrowthPipeline(ctx)),
    Metric.aggregate(engagementPipeline(ctx)),
    Metric.aggregate(timingHeatmapPipeline(ctx)),
    Metric.aggregate(cadencePipeline(ctx)),
  ]);

  const growth: GrowthSeriesPoint[] = growthRaw.map((g: Record<string, number | string>) => ({
    date: String(g.date),
    impressions: Number(g.impressions),
    movingAverage: Number(g.movingAverage),
    growthRate: Number(g.growthRate),
  }));

  const facet = engagementRaw[0] ?? { byNetwork: [], total: [] };
  const total = facet.total[0] ?? { impressions: 0, engagements: 0, engagementRate: 0 };
  const engagementByNetwork: EngagementSummary[] = facet.byNetwork.map(
    (n: Record<string, number | string>) => ({
      network: n.network as NetworkId,
      impressions: Number(n.impressions),
      engagements: Number(n.engagements),
      engagementRate: Number(n.engagementRate),
    }),
  );

  const timing: TimingCell[] = timingRaw.map((t: Record<string, number>) => ({
    day: Number(t.day),
    hour: Number(t.hour),
    score: Number(t.score),
    samples: Number(t.samples),
  }));

  const cadenceScore = cadenceScoreFromBuckets(cadenceRaw);
  const growthRate = growth.length > 1 ? averageGrowth(growth) : 0;

  return assemble({
    from,
    to,
    days,
    growth,
    engagementByNetwork,
    totals: {
      impressions: Number(total.impressions),
      engagements: Number(total.engagements),
      engagementRate: Number(total.engagementRate),
      growthRate,
      cadenceScore,
      publishedCount: timing.reduce((s, c) => s + c.samples, 0),
    },
    timing,
  });
}

/* -------------------------------------------------------------------------- */
/*  Demo: equivalent reducers in JS over the fixture metrics                    */
/* -------------------------------------------------------------------------- */

export function computeAnalytics(
  metrics: MetricPoint[],
  from: Date,
  to: Date,
  days: number,
): AnalyticsBundle {
  const eng = (m: MetricPoint) => m.likes + m.comments + m.shares + m.clicks;

  // latest snapshot per post per day
  const byPostDay = new Map<string, MetricPoint>();
  const sorted = [...metrics].sort((a, b) => a.ts.localeCompare(b.ts));
  for (const m of sorted) {
    const day = m.ts.slice(0, 10);
    byPostDay.set(`${m.postId}:${day}`, m);
  }

  const dayTotals = new Map<string, number>();
  for (const [key, m] of byPostDay) {
    const day = key.split(":")[1];
    dayTotals.set(day, (dayTotals.get(day) ?? 0) + m.impressions);
  }

  const growth: GrowthSeriesPoint[] = [];
  const window: number[] = [];
  for (let i = days; i >= 0; i--) {
    const d = new Date(to.getTime() - i * DAY).toISOString().slice(0, 10);
    const impressions = dayTotals.get(d) ?? 0;
    window.push(impressions);
    if (window.length > 7) window.shift();
    const movingAverage = Math.round(window.reduce((s, v) => s + v, 0) / window.length);
    const prev = growth.length ? growth[growth.length - 1].impressions : 0;
    growth.push({
      date: d,
      impressions,
      movingAverage,
      growthRate: prev > 0 ? (impressions - prev) / prev : 0,
    });
  }

  // latest per post per network
  const byPostNet = new Map<string, MetricPoint>();
  for (const m of sorted) byPostNet.set(`${m.postId}:${m.network}`, m);

  const netAgg = new Map<NetworkId, { impressions: number; engagements: number }>();
  let totalImpr = 0;
  let totalEng = 0;
  for (const m of byPostNet.values()) {
    const cur = netAgg.get(m.network) ?? { impressions: 0, engagements: 0 };
    cur.impressions += m.impressions;
    cur.engagements += eng(m);
    netAgg.set(m.network, cur);
    totalImpr += m.impressions;
    totalEng += eng(m);
  }

  const engagementByNetwork: EngagementSummary[] = NETWORK_LIST.filter((n) => netAgg.has(n.id)).map(
    (n) => {
      const a = netAgg.get(n.id)!;
      return {
        network: n.id,
        impressions: a.impressions,
        engagements: a.engagements,
        engagementRate: a.impressions > 0 ? a.engagements / a.impressions : 0,
      };
    },
  );

  // timing: first snapshot per post -> day/hour bucket
  const firstByPost = new Map<string, MetricPoint>();
  for (const m of sorted) if (!firstByPost.has(m.postId)) firstByPost.set(m.postId, m);

  const cells = new Map<string, { sum: number; n: number }>();
  for (const m of firstByPost.values()) {
    const d = new Date(m.ts);
    const key = `${d.getDay()}:${d.getHours()}`;
    const rate = m.impressions > 0 ? eng(m) / m.impressions : 0;
    const cur = cells.get(key) ?? { sum: 0, n: 0 };
    cur.sum += rate;
    cur.n += 1;
    cells.set(key, cur);
  }
  const timing: TimingCell[] = [];
  for (const [key, v] of cells) {
    const [day, hour] = key.split(":").map(Number);
    timing.push({ day, hour, score: v.sum / v.n, samples: v.n });
  }

  // cadence: gaps between publishes
  const times = [...firstByPost.values()].map((m) => new Date(m.ts).getTime()).sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let i = 1; i < times.length; i++) gaps.push((times[i] - times[i - 1]) / 3.6e6);
  const cadenceScore = cadenceScoreFromGaps(gaps);

  return assemble({
    from,
    to,
    days,
    growth,
    engagementByNetwork,
    totals: {
      impressions: totalImpr,
      engagements: totalEng,
      engagementRate: totalImpr > 0 ? totalEng / totalImpr : 0,
      growthRate: averageGrowth(growth),
      cadenceScore,
      publishedCount: firstByPost.size,
    },
    timing,
  });
}

/* -------------------------------------------------------------------------- */
/*  Shared assembly                                                            */
/* -------------------------------------------------------------------------- */

interface AssembleInput {
  from: Date;
  to: Date;
  days: number;
  growth: GrowthSeriesPoint[];
  engagementByNetwork: EngagementSummary[];
  totals: AnalyticsBundle["totals"];
  timing: TimingCell[];
}

function assemble(input: AssembleInput): AnalyticsBundle {
  const { growth, timing } = input;

  const goldenWindows = [...timing]
    .filter((c) => c.samples >= 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((c) => ({
      day: c.day,
      hour: c.hour,
      score: c.score,
      label: `${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][c.day]} ${String(c.hour).padStart(2, "0")}:00`,
    }));

  const impr = input.totals.impressions;
  const funnel = [
    { stage: "Impressions", value: impr },
    { stage: "Engagements", value: input.totals.engagements },
    {
      stage: "Reactions",
      value: input.engagementByNetwork.reduce((s, n) => s + Math.round(n.engagements * 0.7), 0),
    },
    {
      stage: "Link clicks",
      value: input.engagementByNetwork.reduce((s, n) => s + Math.round(n.engagements * 0.1), 0),
    },
  ];

  const velocity = growth.slice(-14).map((g) => g.movingAverage);

  return {
    range: { from: input.from.toISOString(), to: input.to.toISOString(), days: input.days },
    totals: input.totals,
    growth,
    engagementByNetwork: input.engagementByNetwork,
    funnel,
    timing,
    goldenWindows,
    velocity,
  };
}

function averageGrowth(growth: GrowthSeriesPoint[]) {
  const recent = growth.slice(-14).filter((g) => Number.isFinite(g.growthRate));
  if (!recent.length) return 0;
  return recent.reduce((s, g) => s + g.growthRate, 0) / recent.length;
}

function cadenceScoreFromGaps(gaps: number[]) {
  if (!gaps.length) return 0;
  const ideal = 48; // hours
  const penalty =
    gaps.reduce((s, g) => s + Math.min(1, Math.abs(g - ideal) / ideal), 0) / gaps.length;
  return Math.round((1 - penalty) * 100);
}

function cadenceScoreFromBuckets(buckets: { avgRate?: number; count?: number }[]) {
  if (!buckets.length) return 0;
  const weighted =
    buckets.reduce((s, b) => s + (b.avgRate ?? 0) * (b.count ?? 0), 0) /
    Math.max(1, buckets.reduce((s, b) => s + (b.count ?? 0), 0));
  return Math.round(Math.min(100, weighted * 1600));
}
