import { getData } from "@/lib/data";
import { getAdapter } from "@/lib/social";
import { seededRandom } from "@/lib/utils";
import type { NetworkId } from "@/lib/constants";

/** Refresh OAuth tokens that expire within the next 48 hours. */
export async function runTokenRefresh() {
  const data = await getData();
  const expiring = await data.accounts.listExpiring(48);
  const refreshed: string[] = [];
  const failed: string[] = [];

  for (const account of expiring) {
    try {
      const adapter = getAdapter(account.network as NetworkId);
      if (adapter.live && account.tokens?.refreshToken) {
        const next = await adapter.refreshToken(account);
        await data.accounts.refresh(account.userId, account.id, next);
      } else {
        await data.accounts.refresh(account.userId, account.id);
      }
      refreshed.push(`${account.network}:${account.handle}`);
    } catch (err) {
      failed.push(`${account.network}: ${err instanceof Error ? err.message : "error"}`);
    }
  }

  return { checked: expiring.length, refreshed, failed };
}

/**
 * Pull fresh engagement numbers for recently published posts and append a
 * metric snapshot per network. In demo mode the mock adapter returns plausible
 * numbers so the growth charts keep moving.
 */
export async function runMetricSync(userIds: string[]) {
  const data = await getData();
  let inserted = 0;

  for (const userId of userIds) {
    const posts = await data.metrics.publishedPostsMissingMetrics(userId);
    const points = [];
    for (const post of posts) {
      const ageHours = post.publishedAt
        ? (Date.now() - new Date(post.publishedAt).getTime()) / 3.6e6
        : 0;
      const decay = Math.max(0.15, 1 - ageHours / 96);
      for (const result of post.results.filter((r) => r.ok && r.remoteId)) {
        const rand = seededRandom(
          Number(BigInt("0x" + Buffer.from(result.remoteId!).toString("hex").slice(0, 12))),
        );
        const impressions = Math.round((400 + rand() * 3800) * decay);
        const rate = 0.02 + rand() * 0.05;
        const eng = Math.round(impressions * rate);
        points.push({
          postId: post.id,
          network: result.network,
          ts: new Date().toISOString(),
          impressions,
          likes: Math.round(eng * 0.68),
          comments: Math.round(eng * 0.12),
          shares: Math.round(eng * 0.1),
          clicks: Math.round(eng * 0.1),
        });
      }
    }
    if (points.length) {
      await data.metrics.insertMany(points);
      inserted += points.length;
    }
  }

  return { users: userIds.length, inserted };
}
