import type { PipelineStage } from "mongoose";

/**
 * MongoDB aggregation pipelines behind the Aurora Analytics dashboards.
 * Each function returns a pipeline array so it can be run against the Metric
 * collection directly and unit checked in isolation (see scripts/check-pipelines.ts).
 */

interface Ctx {
  userId: unknown;
  from: Date;
  to: Date;
  timezone: string;
}

const engagementExpr = {
  $add: ["$likes", "$comments", "$shares", "$clicks"],
};

/**
 * Impression growth over time.
 * Buckets snapshots by local day, keeps the latest cumulative reading per
 * post/day, then uses $setWindowFields for a 7 day moving average and a
 * day-over-day growth rate. $densify fills missing days so the line never
 * teleports across gaps.
 */
export function impressionGrowthPipeline(ctx: Ctx): PipelineStage[] {
  return [
    { $match: { userId: ctx.userId, ts: { $gte: ctx.from, $lte: ctx.to } } },
    {
      $addFields: {
        day: {
          $dateTrunc: { date: "$ts", unit: "day", timezone: ctx.timezone },
        },
      },
    },
    // latest snapshot per post per day
    { $sort: { ts: 1 } },
    {
      $group: {
        _id: { post: "$postId", day: "$day" },
        impressions: { $last: "$impressions" },
      },
    },
    {
      $group: {
        _id: "$_id.day",
        impressions: { $sum: "$impressions" },
      },
    },
    { $sort: { _id: 1 } },
    {
      $densify: {
        field: "_id",
        range: { step: 1, unit: "day", bounds: "full" },
      },
    },
    { $set: { impressions: { $ifNull: ["$impressions", 0] } } },
    {
      $setWindowFields: {
        sortBy: { _id: 1 },
        output: {
          movingAverage: {
            $avg: "$impressions",
            window: { documents: [-6, 0] },
          },
          previous: {
            $shift: { output: "$impressions", by: -1, default: 0 },
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        date: {
          $dateToString: { date: "$_id", format: "%Y-%m-%d", timezone: ctx.timezone },
        },
        impressions: 1,
        movingAverage: { $round: ["$movingAverage", 0] },
        growthRate: {
          $cond: [
            { $gt: ["$previous", 0] },
            { $divide: [{ $subtract: ["$impressions", "$previous"] }, "$previous"] },
            0,
          ],
        },
      },
    },
  ];
}

/**
 * Engagement rate, summarised and per network in a single pass with $facet.
 */
export function engagementPipeline(ctx: Ctx): PipelineStage[] {
  return [
    { $match: { userId: ctx.userId, ts: { $gte: ctx.from, $lte: ctx.to } } },
    { $sort: { ts: 1 } },
    {
      $group: {
        _id: { post: "$postId", network: "$network" },
        impressions: { $last: "$impressions" },
        engagements: { $last: engagementExpr },
      },
    },
    {
      $facet: {
        byNetwork: [
          {
            $group: {
              _id: "$_id.network",
              impressions: { $sum: "$impressions" },
              engagements: { $sum: "$engagements" },
            },
          },
          {
            $project: {
              _id: 0,
              network: "$_id",
              impressions: 1,
              engagements: 1,
              engagementRate: {
                $cond: [
                  { $gt: ["$impressions", 0] },
                  { $divide: ["$engagements", "$impressions"] },
                  0,
                ],
              },
            },
          },
          { $sort: { impressions: -1 } },
        ],
        total: [
          {
            $group: {
              _id: null,
              impressions: { $sum: "$impressions" },
              engagements: { $sum: "$engagements" },
            },
          },
          {
            $project: {
              _id: 0,
              impressions: 1,
              engagements: 1,
              engagementRate: {
                $cond: [
                  { $gt: ["$impressions", 0] },
                  { $divide: ["$engagements", "$impressions"] },
                  0,
                ],
              },
            },
          },
        ],
      },
    },
  ];
}

/**
 * Optimal posting time. Groups the latest reading per post by local
 * day-of-week and hour (creator timezone via $dayOfWeek/$hour with a
 * timezone argument), then averages the engagement rate to build a 7x24
 * heatmap. The top cells become "golden windows" surfaced in the composer.
 */
export function timingHeatmapPipeline(ctx: Ctx): PipelineStage[] {
  return [
    { $match: { userId: ctx.userId, ts: { $gte: ctx.from, $lte: ctx.to } } },
    { $sort: { ts: 1 } },
    {
      $group: {
        _id: "$postId",
        impressions: { $last: "$impressions" },
        engagements: { $last: engagementExpr },
        firstTs: { $first: "$ts" },
      },
    },
    {
      $project: {
        rate: {
          $cond: [{ $gt: ["$impressions", 0] }, { $divide: ["$engagements", "$impressions"] }, 0],
        },
        dow: { $subtract: [{ $dayOfWeek: { date: "$firstTs", timezone: ctx.timezone } }, 1] },
        hour: { $hour: { date: "$firstTs", timezone: ctx.timezone } },
      },
    },
    {
      $group: {
        _id: { day: "$dow", hour: "$hour" },
        score: { $avg: "$rate" },
        samples: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        day: "$_id.day",
        hour: "$_id.hour",
        score: { $round: ["$score", 4] },
        samples: 1,
      },
    },
    { $sort: { score: -1 } },
  ];
}

/**
 * Cadence score. $bucketAuto over the gap (in hours) between consecutive
 * publishes, correlated with the average engagement rate of the later post.
 */
export function cadencePipeline(ctx: Ctx): PipelineStage[] {
  return [
    { $match: { userId: ctx.userId, ts: { $gte: ctx.from, $lte: ctx.to } } },
    { $sort: { ts: 1 } },
    {
      $group: {
        _id: "$postId",
        impressions: { $last: "$impressions" },
        engagements: { $last: engagementExpr },
        firstTs: { $first: "$ts" },
      },
    },
    { $sort: { firstTs: 1 } },
    {
      $setWindowFields: {
        sortBy: { firstTs: 1 },
        output: {
          prevTs: { $shift: { output: "$firstTs", by: -1, default: null } },
        },
      },
    },
    {
      $match: { prevTs: { $ne: null } },
    },
    {
      $project: {
        gapHours: {
          $divide: [{ $subtract: ["$firstTs", "$prevTs"] }, 1000 * 60 * 60],
        },
        rate: {
          $cond: [{ $gt: ["$impressions", 0] }, { $divide: ["$engagements", "$impressions"] }, 0],
        },
      },
    },
    {
      $bucketAuto: {
        groupBy: "$gapHours",
        buckets: 4,
        output: { avgRate: { $avg: "$rate" }, count: { $sum: 1 } },
      },
    },
  ];
}
