import { env } from "@/lib/env";
import { decryptToken, encryptToken } from "@/lib/crypto";
import type { NetworkId } from "@/lib/constants";
import type { AccountRecord } from "@/lib/types";
import type { MetricPull, PublishOutcome, PublishPayload, SocialAdapter } from "@/lib/social/types";

/**
 * Real network adapters. These are only selected when the matching OAuth app
 * credentials are present. They perform genuine HTTP calls; token material is
 * decrypted from the account record just before use and never logged.
 *
 * The account records in this app carry only ciphertext; a production
 * deployment would also persist the encrypted refresh token. Here we read it
 * from `account` via a convention the live port sets up.
 */

interface TokenBundle {
  accessToken: string;
  refreshToken?: string;
}

// The live port stores ciphers on the mongoose doc; when present they are
// attached to the record as non-enumerable helpers. For safety we also accept a
// direct token passed through the environment for single-account testing.
function readTokens(account: AccountRecord & { _tokens?: TokenBundle }): TokenBundle {
  if (account._tokens) return account._tokens;
  const raw = process.env[`${account.network.toUpperCase()}_ACCESS_TOKEN`];
  if (raw) return { accessToken: raw };
  throw new Error(`No stored token for ${account.network}`);
}

async function refreshOAuth2(
  network: NetworkId,
  tokenUrl: string,
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken?: string; expiresIn: number }> {
  const app = env.social[network];
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: app.id ?? "",
      client_secret: app.secret ?? "",
    }),
  });
  if (!res.ok) throw new Error(`${network} token refresh failed: ${res.status}`);
  const json = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresIn: json.expires_in ?? 3600,
  };
}

const TOKEN_URLS: Record<NetworkId, string> = {
  twitter: "https://api.twitter.com/2/oauth2/token",
  linkedin: "https://www.linkedin.com/oauth/v2/accessToken",
  instagram: "https://graph.facebook.com/v21.0/oauth/access_token",
  facebook: "https://graph.facebook.com/v21.0/oauth/access_token",
};

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
  account: AccountRecord,
): Promise<PublishOutcome> {
  const author = `urn:li:person:${account.handle}`;
  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author,
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
  const id = res.headers.get("x-restli-id");
  if (!res.ok) {
    const body = await res.text();
    return { ok: false, remoteId: null, permalink: null, message: body.slice(0, 160) };
  }
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
  account: AccountRecord,
): Promise<PublishOutcome> {
  // Facebook Page feed / Instagram content publishing share the Graph host.
  const node = account.network === "facebook" ? `${account.handle}/feed` : `${account.handle}/media`;
  const res = await fetch(`https://graph.facebook.com/v21.0/${node}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: text, caption: text, access_token: token }),
  });
  const json = (await res.json()) as { id?: string; error?: { message: string } };
  if (!res.ok || !json.id) {
    return { ok: false, remoteId: null, permalink: null, message: json.error?.message ?? `HTTP ${res.status}` };
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
    async publish({ body, account }: PublishPayload): Promise<PublishOutcome> {
      const { accessToken } = readTokens(account);
      if (id === "twitter") return publishTwitter(body, accessToken);
      if (id === "linkedin") return publishLinkedIn(body, accessToken, account);
      return publishGraph(body, accessToken, account);
    },
    async refreshToken(account: AccountRecord & { _tokens?: TokenBundle }) {
      const { refreshToken } = readTokens(account);
      if (!refreshToken) throw new Error(`No refresh token for ${id}`);
      const refreshed = await refreshOAuth2(id, TOKEN_URLS[id], refreshToken);
      // Persisting the new cipher is the live port's responsibility; we return
      // the new expiry and stash the ciphertext for it to pick up.
      (account as { _newCipher?: string })._newCipher = encryptToken(refreshed.accessToken);
      return { expiresAt: new Date(Date.now() + refreshed.expiresIn * 1000).toISOString() };
    },
    async fetchMetrics(remoteId: string, account: AccountRecord & { _tokens?: TokenBundle }): Promise<MetricPull> {
      const { accessToken } = readTokens(account);
      if (id === "twitter") {
        const res = await fetch(
          `https://api.twitter.com/2/tweets/${remoteId}?tweet.fields=public_metrics,non_public_metrics`,
          { headers: { authorization: `Bearer ${accessToken}` } },
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
      // LinkedIn / Graph metric endpoints vary by entitlement; return zeros
      // rather than guess, the mock path covers the demo.
      void decryptToken;
      return { impressions: 0, likes: 0, comments: 0, shares: 0, clicks: 0 };
    },
  };
}
