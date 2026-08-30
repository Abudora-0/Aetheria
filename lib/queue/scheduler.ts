import { nanoid } from "nanoid";
import { getData } from "@/lib/data";
import { getAdapter } from "@/lib/social";
import type { NetworkId } from "@/lib/constants";
import type { PostRecord, PublishResult } from "@/lib/types";

const BACKOFF_MINUTES = [1, 5, 15, 60];
const BATCH = 15;

export interface RunReport {
  worker: string;
  claimed: number;
  published: number;
  failed: number;
  details: { postId: string; status: string; reason?: string }[];
}

/**
 * One tick of the publishing worker. Designed to be idempotent and safe to run
 * concurrently: jobs are claimed atomically before any network call, and a
 * stale lock (older than 5 minutes) can be reclaimed by a later run.
 */
export async function runPublishTick(now = new Date()): Promise<RunReport> {
  const worker = `w_${nanoid(8)}`;
  const data = await getData();
  const claimed = await data.posts.claimDue(now, worker, BATCH);

  const report: RunReport = {
    worker,
    claimed: claimed.length,
    published: 0,
    failed: 0,
    details: [],
  };

  for (const post of claimed) {
    const outcome = await publishPost(post);
    await data.posts.recordAttempt(post.id, outcome);

    if (outcome.ok) {
      report.published += 1;
      report.details.push({ postId: post.id, status: "published" });
      // Seed an initial metric snapshot so analytics react immediately.
      await data.metrics.insertMany(
        outcome.results
          .filter((r) => r.ok && r.remoteId)
          .map((r) => ({
            postId: post.id,
            network: r.network,
            ts: new Date().toISOString(),
            impressions: 0,
            likes: 0,
            comments: 0,
            shares: 0,
            clicks: 0,
          })),
      );
    } else {
      report.failed += 1;
      report.details.push({
        postId: post.id,
        status: post.attempts + 1 >= BACKOFF_MINUTES.length ? "failed_final" : "retry_scheduled",
        reason: outcome.failureReason ?? undefined,
      });
    }
  }

  return report;
}

async function publishPost(post: PostRecord): Promise<{
  ok: boolean;
  results: PublishResult[];
  failureReason: string | null;
  nextAttemptAt: string | null;
}> {
  const data = await getData();
  const accounts = await data.accounts.listByUser(post.userId);
  const byNetwork = new Map(accounts.map((a) => [a.network, a]));
  const results: PublishResult[] = [];

  for (const network of post.networks as NetworkId[]) {
    const account = byNetwork.get(network);
    const at = new Date().toISOString();
    if (!account) {
      results.push({
        network,
        ok: false,
        remoteId: null,
        permalink: null,
        message: `No connected ${network} channel`,
        at,
      });
      continue;
    }
    const variant = post.variants.find((v) => v.network === network);
    const body = variant?.body || post.base;
    try {
      const res = await getAdapter(network).publish({ body, media: post.media, account });
      results.push({
        network,
        ok: res.ok,
        remoteId: res.remoteId,
        permalink: res.permalink,
        message: res.message,
        at,
      });
    } catch (err) {
      results.push({
        network,
        ok: false,
        remoteId: null,
        permalink: null,
        message: err instanceof Error ? err.message : "Adapter error",
        at,
      });
    }
  }

  const ok = results.length > 0 && results.every((r) => r.ok);
  if (ok) {
    return { ok: true, results, failureReason: null, nextAttemptAt: null };
  }

  const attemptIndex = post.attempts + 1;
  const failed = results.filter((r) => !r.ok).map((r) => `${r.network}: ${r.message}`);
  const nextAttemptAt =
    attemptIndex < BACKOFF_MINUTES.length
      ? new Date(Date.now() + BACKOFF_MINUTES[attemptIndex] * 60 * 1000).toISOString()
      : null;

  return {
    ok: false,
    results,
    failureReason: failed.join(" | ") || "Publish failed",
    nextAttemptAt,
  };
}
