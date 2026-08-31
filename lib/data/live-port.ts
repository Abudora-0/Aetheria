import { NETWORKS, type NetworkId } from "@/lib/constants";
import { connectToDatabase } from "@/lib/db";
import { Account, Metric, Post, Subscription, User } from "@/models";
import type {
  AccountRecord,
  MetricPoint,
  PostRecord,
  SessionUser,
  SubscriptionRecord,
} from "@/lib/types";
import type { DataPort, HydratedAccount, PostDraftInput } from "@/lib/data/ports";
import { decryptToken, encryptToken } from "@/lib/crypto";

const DAY = 24 * 60 * 60 * 1000;

/* eslint-disable @typescript-eslint/no-explicit-any */

function toUser(doc: any): SessionUser {
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    timezone: doc.timezone,
    plan: doc.plan,
  };
}

function accountStatus(expiresAt: Date | null | undefined): AccountRecord["status"] {
  if (!expiresAt) return "healthy";
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "revoked";
  if (diff < 10 * DAY) return "expiring";
  return "healthy";
}

function toAccount(doc: any): AccountRecord {
  return {
    id: String(doc._id),
    userId: String(doc.userId),
    network: doc.network,
    handle: doc.handle ?? "",
    displayName: doc.displayName ?? "",
    avatarColor: doc.avatarColor ?? "#8B5CF6",
    followers: doc.followers ?? 0,
    connectedAt: (doc.createdAt ?? new Date()).toISOString(),
    tokenExpiresAt: (doc.tokenExpiresAt ?? new Date(Date.now() + 30 * DAY)).toISOString(),
    lastRefreshedAt: doc.lastRefreshedAt ? doc.lastRefreshedAt.toISOString() : null,
    status: doc.status ?? accountStatus(doc.tokenExpiresAt),
  };
}

function toHydratedAccount(doc: any): HydratedAccount {
  const record = toAccount(doc) as HydratedAccount;
  if (doc.accessTokenCipher) {
    try {
      record.tokens = {
        accessToken: decryptToken(doc.accessTokenCipher),
        refreshToken: doc.refreshTokenCipher ? decryptToken(doc.refreshTokenCipher) : undefined,
      };
    } catch {
      /* token unreadable, adapter will fall back or fail cleanly */
    }
  }
  return record;
}

function toPost(doc: any): PostRecord {
  return {
    id: String(doc._id),
    userId: String(doc.userId),
    title: doc.title,
    base: doc.base,
    variants: doc.variants ?? [],
    networks: doc.networks ?? [],
    media: doc.media ?? [],
    status: doc.status,
    scheduledFor: doc.scheduledFor ? doc.scheduledFor.toISOString() : null,
    publishedAt: doc.publishedAt ? doc.publishedAt.toISOString() : null,
    createdAt: (doc.createdAt ?? new Date()).toISOString(),
    updatedAt: (doc.updatedAt ?? new Date()).toISOString(),
    results: (doc.results ?? []).map((r: any) => ({
      network: r.network,
      ok: r.ok,
      remoteId: r.remoteId ?? null,
      permalink: r.permalink ?? null,
      message: r.message ?? "",
      at: r.at ? r.at.toISOString() : new Date().toISOString(),
    })),
    attempts: doc.attempts ?? 0,
    nextAttemptAt: doc.nextAttemptAt ? doc.nextAttemptAt.toISOString() : null,
    lockedAt: doc.lockedAt ? doc.lockedAt.toISOString() : null,
    failureReason: doc.failureReason ?? null,
  };
}

function toMetric(doc: any): MetricPoint {
  return {
    postId: String(doc.postId),
    network: doc.network,
    ts: doc.ts.toISOString(),
    impressions: doc.impressions,
    likes: doc.likes,
    comments: doc.comments,
    shares: doc.shares,
    clicks: doc.clicks,
  };
}

function toSubscription(doc: any, userId: string): SubscriptionRecord {
  return {
    userId,
    plan: doc?.plan ?? "free",
    status: doc?.status ?? "active",
    stripeCustomerId: doc?.stripeCustomerId ?? null,
    stripeSubscriptionId: doc?.stripeSubscriptionId ?? null,
    currentPeriodEnd: (doc?.currentPeriodEnd ?? new Date(Date.now() + 30 * DAY)).toISOString(),
    cancelAtPeriodEnd: doc?.cancelAtPeriodEnd ?? false,
    source: doc?.source ?? "simulated",
  };
}

export const livePort: DataPort = {
  mode: "live",

  users: {
    async findByEmail(email) {
      await connectToDatabase();
      const doc = await User.findOne({ email: email.toLowerCase() }).lean();
      if (!doc) return null;
      return { ...toUser(doc), passwordHash: (doc as any).passwordHash };
    },
    async findById(id) {
      await connectToDatabase();
      const doc = await User.findById(id).lean();
      return doc ? toUser(doc) : null;
    },
    async create(input) {
      await connectToDatabase();
      const doc = await User.create({
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash: input.passwordHash,
        timezone: input.timezone ?? "America/New_York",
        plan: "free",
      });
      await Subscription.create({
        userId: doc._id,
        plan: "free",
        status: "active",
        currentPeriodEnd: new Date(Date.now() + 30 * DAY),
        source: "simulated",
      });
      return toUser(doc);
    },
    async setPlan(userId, plan) {
      await connectToDatabase();
      await User.findByIdAndUpdate(userId, { plan });
    },
    async updateProfile(userId, patch) {
      await connectToDatabase();
      const set: Record<string, unknown> = {};
      if (patch.name) set.name = patch.name;
      if (patch.timezone) set.timezone = patch.timezone;
      const doc = await User.findByIdAndUpdate(userId, { $set: set }, { new: true }).lean();
      if (!doc) throw new Error("User not found");
      return toUser(doc);
    },
  },

  accounts: {
    async listByUser(userId) {
      await connectToDatabase();
      const docs = await Account.find({ userId }).sort({ network: 1 }).lean();
      return docs.map(toAccount);
    },
    async connect(userId, network, tokens) {
      await connectToDatabase();
      const meta = NETWORKS[network as NetworkId];
      const now = Date.now();
      const set: Record<string, unknown> = {
        lastRefreshedAt: new Date(),
        status: "healthy",
      };
      if (tokens) {
        set.accessTokenCipher = encryptToken(tokens.accessToken);
        set.refreshTokenCipher = tokens.refreshToken
          ? encryptToken(tokens.refreshToken)
          : null;
        set.tokenExpiresAt = new Date(now + tokens.expiresIn * 1000);
        if (tokens.handle) set.handle = tokens.handle;
        if (tokens.displayName) set.displayName = tokens.displayName;
      } else {
        // Sandbox connection: no real OAuth app configured.
        set.accessTokenCipher = encryptToken(`sandbox-access-${network}-${now}`);
        set.refreshTokenCipher = encryptToken(`sandbox-refresh-${network}-${now}`);
        set.tokenExpiresAt = new Date(now + 55 * DAY);
      }
      const doc = await Account.findOneAndUpdate(
        { userId, network },
        {
          $setOnInsert: {
            userId,
            network,
            handle: tokens?.handle ?? "you",
            displayName: tokens?.displayName ?? "Your channel",
            avatarColor: meta.accent,
            followers: 120 + Math.floor(Math.random() * 900),
          },
          $set: set,
        },
        { upsert: true, new: true },
      ).lean();
      return toAccount(doc);
    },
    async forPublishing(userId) {
      await connectToDatabase();
      const docs = await Account.find({ userId }).lean();
      return docs.map(toHydratedAccount);
    },
    async disconnect(userId, accountId) {
      await connectToDatabase();
      await Account.deleteOne({ _id: accountId, userId });
    },
    async refresh(userId, accountId, tokens) {
      await connectToDatabase();
      const now = Date.now();
      const set: Record<string, unknown> = { lastRefreshedAt: new Date(), status: "healthy" };
      if (tokens) {
        set.accessTokenCipher = encryptToken(tokens.accessToken);
        if (tokens.refreshToken) set.refreshTokenCipher = encryptToken(tokens.refreshToken);
        set.tokenExpiresAt = new Date(now + tokens.expiresIn * 1000);
      } else {
        set.tokenExpiresAt = new Date(now + 55 * DAY);
      }
      const doc = await Account.findOneAndUpdate({ _id: accountId, userId }, { $set: set }, { new: true }).lean();
      if (!doc) throw new Error("Account not found");
      return toAccount(doc);
    },
    async listExpiring(withinHours) {
      await connectToDatabase();
      const cutoff = new Date(Date.now() + withinHours * 60 * 60 * 1000);
      const docs = await Account.find({
        status: { $ne: "revoked" },
        tokenExpiresAt: { $lt: cutoff },
      }).lean();
      return docs.map(toHydratedAccount);
    },
  },

  posts: {
    async listByUser(userId, filter) {
      await connectToDatabase();
      const query: Record<string, unknown> = { userId };
      if (filter?.status) query.status = { $in: filter.status };
      const docs = await Post.find(query).sort({ scheduledFor: -1, createdAt: -1 }).lean();
      return docs.map(toPost);
    },
    async findById(userId, id) {
      await connectToDatabase();
      const doc = await Post.findOne({ _id: id, userId }).lean();
      return doc ? toPost(doc) : null;
    },
    async save(userId, draft: PostDraftInput) {
      await connectToDatabase();
      const payload = {
        title: draft.title,
        base: draft.base,
        networks: draft.networks,
        variants: draft.variants,
        media: draft.media,
        scheduledFor: draft.scheduledFor ? new Date(draft.scheduledFor) : null,
        status: draft.status,
        nextAttemptAt:
          draft.status === "scheduled" && draft.scheduledFor ? new Date(draft.scheduledFor) : null,
      };
      if (draft.id) {
        const doc = await Post.findOneAndUpdate({ _id: draft.id, userId }, { $set: payload }, { new: true }).lean();
        if (!doc) throw new Error("Post not found");
        return toPost(doc);
      }
      const doc = await Post.create({ ...payload, userId, attempts: 0 });
      return toPost(doc);
    },
    async updateStatus(id, status, patch) {
      await connectToDatabase();
      await Post.findByIdAndUpdate(id, { $set: { status, ...(patch ?? {}) } });
    },
    async reschedule(userId, id, scheduledFor) {
      await connectToDatabase();
      const doc = await Post.findOneAndUpdate(
        { _id: id, userId },
        {
          $set: {
            scheduledFor: new Date(scheduledFor),
            nextAttemptAt: new Date(scheduledFor),
            status: "scheduled",
            lockedAt: null,
          },
        },
        { new: true },
      ).lean();
      if (!doc) throw new Error("Post not found");
      return toPost(doc);
    },
    async cancel(userId, id) {
      await connectToDatabase();
      await Post.findOneAndUpdate(
        { _id: id, userId },
        { $set: { status: "cancelled", nextAttemptAt: null, lockedAt: null } },
      );
    },
    async claimDue(now, workerId, limit) {
      await connectToDatabase();
      const claimed: PostRecord[] = [];
      const staleLock = new Date(Date.now() - 5 * 60 * 1000);
      for (let i = 0; i < limit; i++) {
        const doc = await Post.findOneAndUpdate(
          {
            $and: [
              {
                $or: [
                  { status: "scheduled" },
                  { status: "failed", attempts: { $lt: 4 } },
                ],
              },
              {
                $or: [
                  { nextAttemptAt: { $lte: now } },
                  { nextAttemptAt: null, scheduledFor: { $lte: now } },
                ],
              },
              { $or: [{ lockedAt: null }, { lockedAt: { $lt: staleLock } }] },
            ],
          },
          { $set: { lockedAt: new Date(), lockedBy: workerId, status: "publishing" } },
          { new: true, sort: { scheduledFor: 1 } },
        ).lean();
        if (!doc) break;
        claimed.push(toPost(doc));
      }
      return claimed;
    },
    async recordAttempt(id, outcome) {
      await connectToDatabase();
      const set: Record<string, unknown> = {
        lockedAt: null,
        lockedBy: null,
        results: outcome.results.map((r) => ({ ...r, at: new Date(r.at) })),
      };
      if (outcome.ok) {
        set.status = "published";
        set.publishedAt = new Date();
        set.nextAttemptAt = null;
        set.failureReason = null;
      } else {
        set.status = "failed";
        set.failureReason = outcome.failureReason ?? "Publish failed";
        set.nextAttemptAt = outcome.nextAttemptAt ? new Date(outcome.nextAttemptAt) : null;
      }
      await Post.findByIdAndUpdate(id, { $set: set, $inc: { attempts: 1 } });
    },
  },

  metrics: {
    async insertMany(points) {
      if (points.length === 0) return;
      await connectToDatabase();
      const posts = await Post.find({ _id: { $in: points.map((p) => p.postId) } })
        .select("_id userId")
        .lean();
      const owner = new Map(posts.map((p) => [String(p._id), String((p as any).userId)]));
      await Metric.insertMany(
        points.map((p) => ({
          userId: owner.get(p.postId),
          postId: p.postId,
          network: p.network,
          ts: new Date(p.ts),
          impressions: p.impressions,
          likes: p.likes,
          comments: p.comments,
          shares: p.shares,
          clicks: p.clicks,
        })),
      );
    },
    async forUser(userId, fromISO) {
      await connectToDatabase();
      const docs = await Metric.find({ userId, ts: { $gte: new Date(fromISO) } })
        .sort({ ts: 1 })
        .lean();
      return docs.map(toMetric);
    },
    async publishedPostsMissingMetrics(userId) {
      await connectToDatabase();
      const docs = await Post.find({
        userId,
        status: "published",
        publishedAt: { $gt: new Date(Date.now() - 4 * DAY) },
      }).lean();
      return docs.map(toPost);
    },
  },

  subscription: {
    async forUser(userId) {
      await connectToDatabase();
      const doc = await Subscription.findOne({ userId }).lean();
      return toSubscription(doc, userId);
    },
    async upsert(userId, patch) {
      await connectToDatabase();
      const update: Record<string, unknown> = { ...patch };
      if (patch.currentPeriodEnd) update.currentPeriodEnd = new Date(patch.currentPeriodEnd);
      const doc = await Subscription.findOneAndUpdate(
        { userId },
        { $set: update, $setOnInsert: { userId } },
        { upsert: true, new: true },
      ).lean();
      if (patch.plan) await User.findByIdAndUpdate(userId, { plan: patch.plan });
      return toSubscription(doc, userId);
    },
  },
};
