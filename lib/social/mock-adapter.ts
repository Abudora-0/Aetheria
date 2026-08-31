import type { NetworkId } from "@/lib/constants";
import { seededRandom } from "@/lib/utils";
import type { MetricPull, PublishOutcome, PublishPayload, SocialAdapter } from "@/lib/social/types";

const DAY = 24 * 60 * 60 * 1000;

function hash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Deterministic stand in for a real network API. Publishing "succeeds" unless
 * the body carries the sentinel "FORCE_FAIL", which the test flow uses to
 * exercise the retry path.
 */
export function createMockAdapter(id: NetworkId): SocialAdapter {
  return {
    id,
    live: false,
    async publish({ body, media, account }: PublishPayload): Promise<PublishOutcome> {
      await new Promise((r) => setTimeout(r, 120));
      if (body.includes("FORCE_FAIL")) {
        return {
          ok: false,
          remoteId: null,
          permalink: null,
          message: `${id} rejected the post (forced failure)`,
        };
      }
      const remoteId = `${id}_${hash(body + account.id).toString(36)}`;
      const withMedia = media.length ? ` with ${media.length} attachment${media.length === 1 ? "" : "s"}` : "";
      return {
        ok: true,
        remoteId,
        permalink: `https://${id}.example/${account.handle}/${remoteId}`,
        message: `Published via sandbox adapter${withMedia}`,
      };
    },
    async refreshToken() {
      await new Promise((r) => setTimeout(r, 60));
      return { accessToken: `sandbox-${id}-${Date.now()}`, expiresIn: (55 * DAY) / 1000 };
    },
    async fetchMetrics(remoteId: string): Promise<MetricPull> {
      const rand = seededRandom(hash(remoteId));
      const impressions = Math.round(600 + rand() * 5200);
      const rate = 0.02 + rand() * 0.06;
      const eng = Math.round(impressions * rate);
      return {
        impressions,
        likes: Math.round(eng * 0.68),
        comments: Math.round(eng * 0.12),
        shares: Math.round(eng * 0.1),
        clicks: Math.round(eng * 0.1),
      };
    },
  };
}
