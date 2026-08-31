import type { NetworkId } from "@/lib/constants";
import { refreshAccessToken } from "@/lib/social/oauth";
import type {
  AdapterAccount,
  MetricPull,
  PublishOutcome,
  PublishPayload,
  RefreshOutcome,
  SocialAdapter,
} from "@/lib/social/types";

/**
 * Real network adapters, selected only when the matching OAuth app credentials
 * are present AND the account carries decrypted tokens (populated by the live
 * data port). Token material is read just before use and never logged.
 */

function accessToken(account: AdapterAccount): string {
  if (account.tokens?.accessToken) return account.tokens.accessToken;
  const fallback = process.env[`${account.network.toUpperCase()}_ACCESS_TOKEN`];
  if (fallback) return fallback;
  throw new Error(`No stored access token for ${account.network}`);
}

async function publishTwitter(text: string, token: string): Promise<PublishOutcome> {
  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const json = (await res.json()) as { data?: { id: string }; detail?: string };
  if (!res.ok || !json.data) {
    return { ok: false, remoteId: null, permalink: null, message: json.detail ?? `HTTP ${res.status}` };
  }
  return {
    ok: true,
    remoteId: json.data.id,
    permalink: `https://x.com/i/web/status/${json.data.id}`,
    message: "Published to X",
  };
}

async function publishLinkedIn(
  text: string,
  token: string,
  account: AdapterAccount,
): Promise<PublishOutcome> {
  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: `urn:li:person:${account.handle}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });
  if (!res.ok) {
    return { ok: false, remoteId: null, permalink: null, message: (await res.text()).slice(0, 160) };
  }
  const id = res.headers.get("x-restli-id");
  return {
    ok: true,
    remoteId: id,
    permalink: id ? `https://www.linkedin.com/feed/update/${id}` : null,
    message: "Published to LinkedIn",
  };
}

async function publishGraph(
  text: string,
  token: string,
  account: AdapterAccount,
  mediaUrl: string | null,
): Promise<PublishOutcome> {
  const isFacebook = account.network === "facebook";
  const node = isFacebook ? `${account.handle}/feed` : `${account.handle}/media`;
  const payload: Record<string, unknown> = { access_token: token };
  if (isFacebook) {
    payload.message = text;
    if (mediaUrl) payload.link = mediaUrl;
  } else {
    // Instagram content publishing needs an image URL for the media container.
    payload.caption = text;
    if (mediaUrl) payload.image_url = mediaUrl;
  }
  const res = await fetch(`https://graph.facebook.com/v21.0/${node}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as { id?: string; error?: { message: string } };
  if (!res.ok || !json.id) {
    return {
      ok: false,
      remoteId: null,
      permalink: null,
      message: json.error?.message ?? `HTTP ${res.status}`,
    };
  }
  return {
    ok: true,
    remoteId: json.id,
    permalink: `https://www.${account.network}.com/${json.id}`,
    message: `Published to ${account.network}`,
  };
}

export function createRealAdapter(id: NetworkId): SocialAdapter {
  return {
    id,
    live: true,
    async publish({ body, media, account }: PublishPayload): Promise<PublishOutcome> {
      const token = accessToken(account);
      if (id === "twitter") return publishTwitter(body, token);
      if (id === "linkedin") return publishLinkedIn(body, token, account);
      return publishGraph(body, token, account, media[0]?.url ?? null);
    },
    async refreshToken(account: AdapterAccount): Promise<RefreshOutcome> {
      const refresh = account.tokens?.refreshToken;
      if (!refresh) throw new Error(`No refresh token stored for ${id}`);
      return refreshAccessToken(id, refresh);
    },
    async fetchMetrics(remoteId: string, account: AdapterAccount): Promise<MetricPull> {
      const token = accessToken(account);
      if (id === "twitter") {
        const res = await fetch(
          `https://api.twitter.com/2/tweets/${remoteId}?tweet.fields=public_metrics,non_public_metrics`,
          { headers: { authorization: `Bearer ${token}` } },
        );
        const json = (await res.json()) as {
          data?: {
            public_metrics?: { like_count: number; reply_count: number; retweet_count: number };
            non_public_metrics?: { impression_count: number; url_link_clicks: number };
          };
        };
        const pm = json.data?.public_metrics;
        const npm = json.data?.non_public_metrics;
        return {
          impressions: npm?.impression_count ?? 0,
          likes: pm?.like_count ?? 0,
          comments: pm?.reply_count ?? 0,
          shares: pm?.retweet_count ?? 0,
          clicks: npm?.url_link_clicks ?? 0,
        };
      }
      // LinkedIn and Graph metric endpoints vary by API entitlement; the metric
      // sync worker fills these with modelled numbers rather than guessing here.
      return { impressions: 0, likes: 0, comments: 0, shares: 0, clicks: 0 };
    },
  };
}
