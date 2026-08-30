/**
 * Seed a MongoDB database with a realistic 90 day history so every dashboard
 * and aggregation pipeline has data to work with.
 *
 *   MONGODB_URI="mongodb+srv://..." npm run seed
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { generateDemoDataset } from "../lib/demo/generate";
import { Account, Metric, Post, Subscription, User } from "../models";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Set MONGODB_URI before seeding.");
    process.exit(1);
  }

  await mongoose.connect(uri, { dbName: "aetheria" });
  console.log("connected");

  const data = generateDemoDataset();

  await Promise.all([
    User.deleteMany({ email: data.user.email }),
    Account.deleteMany({}),
    Post.deleteMany({}),
    Metric.deleteMany({}),
    Subscription.deleteMany({}),
  ]);

  const user = await User.create({
    name: data.user.name,
    email: data.user.email,
    passwordHash: await bcrypt.hash(data.user.password, 10),
    timezone: data.user.timezone,
    plan: data.user.plan,
  });
  console.log(`user ${user.email} / ${data.user.password}`);

  const accountDocs = await Account.insertMany(
    data.accounts.map((a) => ({
      userId: user._id,
      network: a.network,
      handle: a.handle,
      displayName: a.displayName,
      avatarColor: a.avatarColor,
      followers: a.followers,
      tokenExpiresAt: new Date(a.tokenExpiresAt),
      lastRefreshedAt: a.lastRefreshedAt ? new Date(a.lastRefreshedAt) : null,
      status: a.status,
    })),
  );
  console.log(`${accountDocs.length} accounts`);

  const idMap = new Map<string, mongoose.Types.ObjectId>();
  const postDocs = await Post.insertMany(
    data.posts.map((p) => {
      const _id = new mongoose.Types.ObjectId();
      idMap.set(p.id, _id);
      return {
        _id,
        userId: user._id,
        title: p.title,
        base: p.base,
        variants: p.variants,
        networks: p.networks,
        media: p.media,
        status: p.status,
        scheduledFor: p.scheduledFor ? new Date(p.scheduledFor) : null,
        publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
        results: p.results.map((r) => ({ ...r, at: new Date(r.at) })),
        attempts: p.attempts,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      };
    }),
  );
  console.log(`${postDocs.length} posts`);

  const metricDocs = await Metric.insertMany(
    data.metrics
      .filter((m) => idMap.has(m.postId))
      .map((m) => ({
        userId: user._id,
        postId: idMap.get(m.postId),
        network: m.network,
        ts: new Date(m.ts),
        impressions: m.impressions,
        likes: m.likes,
        comments: m.comments,
        shares: m.shares,
        clicks: m.clicks,
      })),
  );
  console.log(`${metricDocs.length} metric snapshots`);

  await Subscription.create({
    userId: user._id,
    plan: data.subscription.plan,
    status: data.subscription.status,
    currentPeriodEnd: new Date(data.subscription.currentPeriodEnd),
    source: data.subscription.source,
  });

  console.log("done");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
