import { env } from "@/lib/env";
import type { OAuthTokens } from "@/lib/social/oauth";

/**
 * Facebook Page publishing needs a Page access token, not the user token the
 * standard OAuth exchange returns. `/me/feed` for a personal profile is not
 * publishable at all (Meta retired that for regular users years ago), which
 * is exactly the confusing "(#200) requires ... page token" error you get if
 * you try it. The real flow:
 *
 *  1. code -> short lived user access token
 *  2. short lived user token -> long lived user token (fb_exchange_token)
 *  3. long lived user token -> the Pages the user manages, each with its own
 *     Page access token (GET /me/accounts)
 *
 * We publish as the first Page the user manages. The Page token is stored as
 * the access token; the long lived user token is stored as the refresh
 * token so it can be used to re-derive a fresh Page token later.
 */

const GRAPH = "https://graph.facebook.com/v21.0";

function redirectUri() {
  return `${env.appUrl.replace(/\/+$/, "")}/api/oauth/facebook/callback`;
}

interface FbTokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: { message?: string };
}

interface FbPage {
  id: string;
  name: string;
  access_token: string;
}

async function exchangeLongLivedUserToken(shortToken: string) {
  const app = env.social.facebook;
  const url = new URL(`${GRAPH}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", app.id ?? "");
  url.searchParams.set("client_secret", app.secret ?? "");
  url.searchParams.set("fb_exchange_token", shortToken);
  const res = await fetch(url);
  const json = (await res.json()) as FbTokenResponse;
  if (!res.ok || !json.access_token) {
    throw new Error(json.error?.message || `facebook long lived token exchange failed (${res.status})`);
  }
  return { token: json.access_token, expiresIn: Number(json.expires_in ?? 60 * 24 * 60 * 60) };
}

async function firstManagedPage(userToken: string): Promise<FbPage> {
  const url = new URL(`${GRAPH}/me/accounts`);
  url.searchParams.set("fields", "id,name,access_token");
  url.searchParams.set("access_token", userToken);
  const res = await fetch(url);
  const json = (await res.json()) as { data?: FbPage[]; error?: { message?: string } };
  const page = json.data?.[0];
  if (!res.ok || !page) {
    throw new Error(
      json.error?.message ||
        "No Facebook Page found for this account. Connect a Page you administer, not a personal profile.",
    );
  }
  return page;
}

export async function fbExchangeCode(code: string): Promise<OAuthTokens> {
  const app = env.social.facebook;
  const body = new URLSearchParams({
    client_id: app.id ?? "",
    client_secret: app.secret ?? "",
    grant_type: "authorization_code",
    redirect_uri: redirectUri(),
    code,
  });
  const res = await fetch(`${GRAPH}/oauth/access_token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body,
  });
  const json = (await res.json()) as FbTokenResponse;
  if (!res.ok || !json.access_token) {
    throw new Error(json.error?.message || `facebook token exchange failed (${res.status})`);
  }

  const { token: longLivedUserToken, expiresIn } = await exchangeLongLivedUserToken(json.access_token);
  const page = await firstManagedPage(longLivedUserToken);

  return { accessToken: page.access_token, refreshToken: longLivedUserToken, expiresIn };
}

export async function fbRefresh(longLivedUserToken: string): Promise<OAuthTokens> {
  const { token, expiresIn } = await exchangeLongLivedUserToken(longLivedUserToken);
  const page = await firstManagedPage(token);
  return { accessToken: page.access_token, refreshToken: token, expiresIn };
}
