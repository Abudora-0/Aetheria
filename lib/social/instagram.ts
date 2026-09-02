import { env } from "@/lib/env";
import type { ConnectProfile, OAuthTokens } from "@/lib/social/oauth";

/**
 * Instagram API with Instagram Login (the current Meta flow, replacing the old
 * Facebook-Page-linked Instagram Graph API). It has its own quirks:
 *
 *  - authorize on instagram.com, token exchange on api.instagram.com
 *  - the returned code carries a trailing "#_" on web redirects
 *  - the first token lasts one hour; it must be swapped for a 60 day token
 *  - "refresh" re-uses the long lived access token itself, no separate refresh
 *    token exists, so we store the access token in both slots
 *  - publishing and profile reads run against graph.instagram.com
 */

const AUTH_HOST = "https://api.instagram.com";
const GRAPH = "https://graph.instagram.com";
const LONG_LIVED_TTL_SECONDS = 60 * 24 * 60 * 60;

function redirectUri() {
  return `${env.appUrl.replace(/\/+$/, "")}/api/oauth/instagram/callback`;
}

interface IgTokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  user_id?: string | number;
  data?: Array<{ access_token: string; user_id: string | number }>;
  error_message?: string;
  error_type?: string;
  error?: { message?: string };
}

export async function igExchangeCode(code: string): Promise<OAuthTokens> {
  const app = env.social.instagram;
  const body = new URLSearchParams({
    client_id: app.id ?? "",
    client_secret: app.secret ?? "",
    grant_type: "authorization_code",
    redirect_uri: redirectUri(),
    code: code.replace(/#_$/, ""),
  });

  const shortRes = await fetch(`${AUTH_HOST}/oauth/access_token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body,
  });
  const shortJson = (await shortRes.json()) as IgTokenResponse;
  const shortToken = shortJson.access_token ?? shortJson.data?.[0]?.access_token;
  if (!shortRes.ok || !shortToken) {
    throw new Error(
      shortJson.error_message || shortJson.error?.message || `instagram token exchange failed (${shortRes.status})`,
    );
  }

  // Swap the one hour token for a 60 day token.
  const longUrl = new URL(`${GRAPH}/access_token`);
  longUrl.searchParams.set("grant_type", "ig_exchange_token");
  longUrl.searchParams.set("client_secret", app.secret ?? "");
  longUrl.searchParams.set("access_token", shortToken);
  const longRes = await fetch(longUrl);
  const longJson = (await longRes.json()) as IgTokenResponse;

  if (!longRes.ok || !longJson.access_token) {
    // Keep the short lived token rather than failing the whole connect.
    return { accessToken: shortToken, refreshToken: shortToken, expiresIn: 3600 };
  }
  return {
    accessToken: longJson.access_token,
    refreshToken: longJson.access_token,
    expiresIn: Number(longJson.expires_in ?? LONG_LIVED_TTL_SECONDS),
  };
}

export async function igRefresh(token: string): Promise<OAuthTokens> {
  const url = new URL(`${GRAPH}/refresh_access_token`);
  url.searchParams.set("grant_type", "ig_refresh_token");
  url.searchParams.set("access_token", token);
  const res = await fetch(url);
  const json = (await res.json()) as IgTokenResponse;
  if (!res.ok || !json.access_token) {
    throw new Error(json.error_message || json.error?.message || `instagram refresh failed (${res.status})`);
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.access_token,
    expiresIn: Number(json.expires_in ?? LONG_LIVED_TTL_SECONDS),
  };
}

export async function igFetchProfile(token: string): Promise<ConnectProfile> {
  try {
    const url = new URL(`${GRAPH}/v21.0/me`);
    url.searchParams.set("fields", "user_id,username,name");
    url.searchParams.set("access_token", token);
    const res = await fetch(url);
    if (!res.ok) return { handle: "instagram", displayName: "Your account" };
    const j = (await res.json()) as { username?: string; name?: string };
    return {
      handle: j.username ?? "instagram",
      displayName: j.name || j.username || "Your account",
    };
  } catch {
    return { handle: "instagram", displayName: "Your account" };
  }
}
