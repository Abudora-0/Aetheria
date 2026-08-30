import { NETWORKS } from "@/lib/constants";
import { shortId } from "@/lib/utils";
import type { AccountRecord, PostRecord } from "@/lib/types";
import type { DataPort, PostDraftInput } from "@/lib/data/ports";
import { demoStore } from "@/lib/data/demo-store";

const DAY = 24 * 60 * 60 * 1000;

export const demoPort: DataPort = {
  mode: "demo",

  users: {
    async findByEmail(email) {
      return demoStore().users.find((u) => u.email === email.toLowerCase()) ?? null;
    },
    async findById(id) {
      const u = demoStore().users.find((x) => x.id === id);
      if (!u) return null;
      const { passwordHash: _ph, ...rest } = u;
      void _ph;
      return rest;
    },
    async create(input) {
      const store = demoStore();
      const user = {
        id: shortId("usr"),
        name: input.name,
        email: input.email.toLowerCase(),
        timezone: input.timezone ?? "America/New_York",
        plan: "free" as const,
        passwordHash: input.passwordHash,
      };
      store.users.push(user);
      store.subscriptions.push({
        userId: user.id,
        plan: "free",
        status: "active",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        currentPeriodEnd: new Date(Date.now() + 30 * DAY).toISOString(),
        cancelAtPeriodEnd: false,
        source: "simulated",
      });
      const { passwordHash: _ph, ...rest } = user;
      void _ph;
      return rest;
    },
    async setPlan(userId, plan) {
      const u = demoStore().users.find((x) => x.id === userId);
      if (u) u.plan = plan;
    },
    async updateProfile(userId, patch) {
      const u = demoStore().users.find((x) => x.id === userId);
      if (!u) throw new Error("User not found");
      if (patch.name) u.name = patch.name;
      if (patch.timezone) u.timezone = patch.timezone;
      const { passwordHash: _ph, ...rest } = u;
      void _ph;
      return rest;
    },
  },

  accounts: {
    async listByUser(userId) {
      return demoStore()
        .accounts.filter((a) => a.userId === userId)
        .sort((a, b) => a.network.localeCompare(b.network));
    },
    async connect(userId, network) {
      const store = demoStore();
      const existing = store.accounts.find((a) => a.userId === userId && a.network === network);
      if (existing) return existing;
      const meta = NETWORKS[network];
      const account: AccountRecord = {
        id: shortId("acc"),
        userId,
        network,
        handle: "you",
        displayName: "Your channel",
        avatarColor: meta.accent,
        followers: 120 + Math.floor(Math.random() * 900),
        connectedAt: new Date().toISOString(),
        tokenExpiresAt: new Date(Date.now() + 55 * DAY).toISOString(),
        lastRefreshedAt: new Date().toISOString(),
        status: "healthy",
      };
      store.accounts.push(account);
      return account;
    },
    async disconnect(userId, accountId) {
      const store = demoStore();
      store.accounts = store.accounts.filter((a) => !(a.userId === userId && a.id === accountId));
    },
    async refresh(userId, accountId) {
      const store = demoStore();
      const account = store.accounts.find((a) => a.userId === userId && a.id === accountId);
      if (!account) throw new Error("Account not found");
      account.tokenExpiresAt = new Date(Date.now() + 55 * DAY).toISOString();
      account.lastRefreshedAt = new Date().toISOString();
      account.status = "healthy";
      return account;
    },
    async listExpiring(withinHours) {
      const cutoff = Date.now() + withinHours * 60 * 60 * 1000;
      return demoStore().accounts.filter(
        (a) => a.status !== "revoked" && new Date(a.tokenExpiresAt).getTime() < cutoff,
      );
    },
  },

  posts: {
    async listByUser(userId, filter) {
      let list = demoStore().posts.filter((p) => p.userId === userId);
      if (filter?.status) list = list.filter((p) => filter.status!.includes(p.status));
      return list
        .slice()
        .sort((a, b) => (b.scheduledFor ?? b.createdAt).localeCompare(a.scheduledFor ?? a.createdAt));
    },
    async findById(userId, id) {
      return demoStore().posts.find((p) => p.userId === userId && p.id === id) ?? null;
    },
    async save(userId, draft: PostDraftInput) {
      const store = demoStore();
      const now = new Date().toISOString();
      if (draft.id) {
        const post = store.posts.find((p) => p.userId === userId && p.id === draft.id);
        if (!post) throw new Error("Post not found");
        Object.assign(post, {
          title: draft.title,
          base: draft.base,
          networks: draft.networks,
          variants: draft.variants,
          media: draft.media,
          scheduledFor: draft.scheduledFor,
          status: draft.status,
          updatedAt: now,
          nextAttemptAt: draft.status === "scheduled" ? draft.scheduledFor : null,
        });
        return post;
      }
      const post: PostRecord = {
        id: shortId("post"),
        userId,
        title: draft.title,
        base: draft.base,
        variants: draft.variants,
        networks: draft.networks,
        media: draft.media,
        status: draft.status,
        scheduledFor: draft.scheduledFor,
        publishedAt: null,
        createdAt: now,
        updatedAt: now,
        results: [],
        attempts: 0,
        nextAttemptAt: draft.status === "scheduled" ? draft.scheduledFor : null,
        lockedAt: null,
        failureReason: null,
      };
      store.posts.unshift(post);
      return post;
    },
    async updateStatus(id, status, patch) {
      const post = demoStore().posts.find((p) => p.id === id);
      if (!post) return;
      post.status = status;
      Object.assign(post, patch ?? {});
      post.updatedAt = new Date().toISOString();
    },
    async reschedule(userId, id, scheduledFor) {
      const post = demoStore().posts.find((p) => p.userId === userId && p.id === id);
      if (!post) throw new Error("Post not found");
      post.scheduledFor = scheduledFor;
      post.nextAttemptAt = scheduledFor;
      post.status = "scheduled";
      post.updatedAt = new Date().toISOString();
      return post;
    },
    async cancel(userId, id) {
      const post = demoStore().posts.find((p) => p.userId === userId && p.id === id);
      if (post) {
        post.status = "cancelled";
        post.nextAttemptAt = null;
      }
    },
    async claimDue(now, workerId, limit) {
      const store = demoStore();
      const claimed: PostRecord[] = [];
      for (const post of store.posts) {
        if (claimed.length >= limit) break;
        const due = post.nextAttemptAt ?? post.scheduledFor;
        const staleLock = post.lockedAt && Date.now() - new Date(post.lockedAt).getTime() > 5 * 60 * 1000;
        if (
          (post.status === "scheduled" || (post.status === "failed" && post.attempts < 4)) &&
          due &&
          new Date(due) <= now &&
          (!post.lockedAt || staleLock)
        ) {
          post.lockedAt = new Date().toISOString();
          post.status = "publishing";
          claimed.push(post);
          void workerId;
        }
      }
      return claimed;
    },
    async recordAttempt(id, outcome) {
      const post = demoStore().posts.find((p) => p.id === id);
      if (!post) return;
      post.attempts += 1;
      post.lockedAt = null;
      post.results = outcome.results;
      if (outcome.ok) {
        post.status = "published";
        post.publishedAt = new Date().toISOString();
        post.nextAttemptAt = null;
        post.failureReason = null;
      } else {
        post.status = "failed";
        post.failureReason = outcome.failureReason ?? "Publish failed";
        post.nextAttemptAt = outcome.nextAttemptAt ?? null;
      }
      post.updatedAt = new Date().toISOString();
    },
  },

  metrics: {
    async insertMany(points) {
      demoStore().metrics.push(...points);
    },
    async forUser(userId, fromISO) {
      const userPosts = new Set(
        demoStore()
          .posts.filter((p) => p.userId === userId)
          .map((p) => p.id),
      );
      return demoStore().metrics.filter((m) => userPosts.has(m.postId) && m.ts >= fromISO);
    },
    async publishedPostsMissingMetrics(userId) {
      const store = demoStore();
      const recent = Date.now() - 6 * 60 * 60 * 1000;
      return store.posts.filter(
        (p) =>
          p.userId === userId &&
          p.status === "published" &&
          p.publishedAt &&
          new Date(p.publishedAt).getTime() > Date.now() - 4 * DAY &&
          !store.metrics.some((m) => m.postId === p.id && new Date(m.ts).getTime() > recent),
      );
    },
  },

  subscription: {
    async forUser(userId) {
      const store = demoStore();
      let sub = store.subscriptions.find((s) => s.userId === userId);
      if (!sub) {
        sub = {
          userId,
          plan: "free",
          status: "active",
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          currentPeriodEnd: new Date(Date.now() + 30 * DAY).toISOString(),
          cancelAtPeriodEnd: false,
          source: "simulated",
        };
        store.subscriptions.push(sub);
      }
      return sub;
    },
    async upsert(userId, patch) {
      const store = demoStore();
      let sub = store.subscriptions.find((s) => s.userId === userId);
      if (!sub) {
        sub = {
          userId,
          plan: "free",
          status: "active",
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          currentPeriodEnd: new Date(Date.now() + 30 * DAY).toISOString(),
          cancelAtPeriodEnd: false,
          source: "simulated",
        };
        store.subscriptions.push(sub);
      }
      Object.assign(sub, patch);
      const user = store.users.find((u) => u.id === userId);
      if (user && patch.plan) user.plan = patch.plan;
      return sub;
    },
  },
};
