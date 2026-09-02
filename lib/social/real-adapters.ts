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

const GRAPH = "https://graph.facebook.com/v21.0";

async function graphPost(node: string, params: Record<string, string>) {
  const res = await fetch(`${GRAPH}/${node}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });
  const json = (await res.json()) as { id?: string; status_code?: string; error?: { message: string } };
  return { ok: res.ok, status: res.status, json };
}

async function publishFacebook(text: string, token: string, account: AdapterAccount, mediaUrl: string | null) {
  const params: Record<string, string> = { access_token: token, message: text };
  if (mediaUrl) params.link = mediaUrl;
  const { ok, status, json } = await graphPost(`${account.handle}/feed`, params);
  if (!ok || !json.id) {
    return { ok: false, remoteId: null, permalink: null, message: json.error?.message ?? `HTTP ${status}` };
  }
  return {
    ok: true,
    remoteId: json.id,
    permalink: `https://www.facebook.com/${json.id}`,
    message: "Published to Facebook",
  };
}

const IG_GRAPH = "https://graph.instagram.com/v21.0";

async function igGraphPost(node: string, params: Record<string, string>) {
  const url = new URL(`${IG_GRAPH}/${node}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { method: "POST" });
  const json = (await res.json()) as { id?: string; status_code?: string; error?: { message: string } };
  return { ok: res.ok, status: res.status, json };
}

/**
 * Instagram content publishing (Instagram API with Instagram Login) is a two
 * step flow on graph.instagram.com: create a media container from a public
 * image URL, wait for it to finish processing, then publish it. The token is
 * scoped to one Instagram user so "me" resolves to that account.
 */
async function publishInstagram(text: string, token: string, mediaUrl: string | null) {
  if (!mediaUrl) {
    return { ok: false, remoteId: null, permalink: null, message: "Instagram requires an image" };
  }

  const container = await igGraphPost("me/media", {
    image_url: mediaUrl,
    caption: text,
    access_token: token,
  });
  if (!container.ok || !container.json.id) {
    return {
      ok: false,
      remoteId: null,
      permalink: null,
      message: container.json.error?.message ?? `container failed (HTTP ${container.status})`,
    };
  }
  const creationId = container.json.id;

  // Poll the container until it finishes processing (image containers are
  // usually ready within a few seconds).
  for (let attempt = 0; attempt < 5; attempt++) {
    const statusUrl = new URL(`${IG_GRAPH}/${creationId}`);
    statusUrl.searchParams.set("fields", "status_code");
    statusUrl.searchParams.set("access_token", token);
    const status = (await fetch(statusUrl)
      .then((r) => r.json())
      .catch(() => ({}))) as { status_code?: string };
    if (status.status_code === "FINISHED") break;
    if (status.status_code === "ERROR" || status.status_code === "EXPIRED") {
      return { ok: false, remoteId: null, permalink: null, message: `media container ${status.status_code}` };
    }
    await new Promise((r) => setTimeout(r, 3000));
  }

  const publish = await igGraphPost("me/media_publish", {
    creation_id: creationId,
    access_token: token,
  });
  if (!publish.ok || !publish.json.id) {
    return {
      ok: false,
      remoteId: null,
      permalink: null,
      message: publish.json.error?.message ?? `publish failed (HTTP ${publish.status})`,
    };
  }

  // Best effort: resolve the real permalink for the published media.
  let permalink: string | null = null;
  try {
    const permUrl = new URL(`${IG_GRAPH}/${publish.json.id}`);
    permUrl.searchParams.set("fields", "permalink");
    permUrl.searchParams.set("access_token", token);
    const perm = (await fetch(permUrl).then((r) => r.json())) as { permalink?: string };
    permalink = perm.permalink ?? null;
  } catch {
    permalink = null;
  }

  return { ok: true, remoteId: publish.json.id, permalink, message: "Published to Instagram" };
}

function publishGraph(
  text: string,
  token: string,
  account: AdapterAccount,
  mediaUrl: string | null,
): Promise<PublishOutcome> {
  return account.network === "facebook"
    ? publishFacebook(text, token, account, mediaUrl)
    : publishInstagram(text, token, mediaUrl);
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
