/**
 * Run each analytics aggregation pipeline against the seeded database and print
 * a shape summary. Useful for verifying the pipelines after a schema change.
 *
 *   MONGODB_URI="..." npm run pipelines:check
 */
import "dotenv/config";
import mongoose from "mongoose";
import { Metric, User } from "../models";
import {
  impressionGrowthPipeline,
  engagementPipeline,
  timingHeatmapPipeline,
  cadencePipeline,
} from "../lib/analytics/pipelines";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Set MONGODB_URI first.");
    process.exit(1);
  }
  await mongoose.connect(uri, { dbName: "aetheria" });

  const user = (await User.findOne().lean()) as { _id: unknown; timezone?: string } | null;
  if (!user) {
    console.error("No users. Run npm run seed first.");
    process.exit(1);
  }

  const ctx = {
    userId: user._id,
    from: new Date(Date.now() - 90 * 864e5),
    to: new Date(),
    timezone: user.timezone ?? "UTC",
  };

  const growth = await Metric.aggregate(impressionGrowthPipeline(ctx));
  console.log(`impressionGrowth  -> ${growth.length} daily points`, growth.at(-1));

  const engagement = await Metric.aggregate(engagementPipeline(ctx));
  console.log(`engagement (facet) -> networks: ${engagement[0]?.byNetwork.length}`, engagement[0]?.total[0]);

  const timing = await Metric.aggregate(timingHeatmapPipeline(ctx));
  console.log(`timingHeatmap     -> ${timing.length} cells, top`, timing[0]);

  const cadence = await Metric.aggregate(cadencePipeline(ctx));
  console.log(`cadence buckets   -> ${cadence.length}`, cadence);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
