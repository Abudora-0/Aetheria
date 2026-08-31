import crypto from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";
import type { NetworkId } from "@/lib/constants";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  scope?: string;
}

export interface ConnectProfile {
  handle: string;
  displayName: string;
}

interface ProviderConfig {
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string;
  pkce: boolean;
  clientAuth: "basic" | "body";
  profileUrl?: string;
  parseProfile?: (json: any) => ConnectProfile;
  extraAuthorizeParams?: Record<string, string>;
}

const PROVIDERS: Record<NetworkId, ProviderConfig> = {
  twitter: {
    authorizeUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    scopes: "tweet.read tweet.write users.read offline.access",
    pkce: true,
    clientAuth: "basic",
    profileUrl: "https://api.twitter.com/2/users/me",
    parseProfile: (j) => ({
      handle: j?.data?.username ?? "user",
      displayName: j?.data?.name ?? "Your channel",
    }),
  },
  linkedin: {
    authorizeUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    scopes: "openid profile w_member_social",
    pkce: false,
    clientAuth: "body",
    profileUrl: "https://api.linkedin.com/v2/userinfo",
    parseProfile: (j) => ({ handle: j?.sub ?? "member", displayName: j?.name ?? "Your channel" }),
  },
  facebook: {
    authorizeUrl: "https://www.facebook.com/v21.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v21.0/oauth/access_token",
    scopes: "public_profile pages_manage_posts pages_read_engagement",
    pkce: false,
    clientAuth: "body",
    profileUrl: "https://graph.facebook.com/v21.0/me?fields=id,name",
    parseProfile: (j) => ({ handle: j?.id ?? "me", displayName: j?.name ?? "Your page" }),
  },
  instagram: {
    authorizeUrl: "https://www.facebook.com/v21.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v21.0/oauth/access_token",
    scopes: "public_profile instagram_basic instagram_content_publish pages_show_list",
    pkce: false,
    clientAuth: "body",
    profileUrl: "https://graph.facebook.com/v21.0/me?fields=id,name",
    parseProfile: (j) => ({ handle: j?.id ?? "me", displayName: j?.name ?? "Your account" }),
  },
};

export function providerConfig(network: NetworkId) {
  return PROVIDERS[network];
}

export function oauthRedirectUri(network: NetworkId) {
  return `${env.appUrl.replace(/\/+$/, "")}/api/oauth/${network}/callback`;
}

export function createPkcePair() {
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function buildAuthorizeUrl(
  network: NetworkId,
  opts: { state: string; codeChallenge?: string },
) {
  const cfg = PROVIDERS[network];
  const app = env.social[network];
  const params = new URLSearchParams({
    response_type: "code",
    client_id: app.id ?? "",
    redirect_uri: oauthRedirectUri(network),
    scope: cfg.scopes,
    state: opts.state,
    ...cfg.extraAuthorizeParams,
  });
  if (cfg.pkce && opts.codeChallenge) {
    params.set("code_challenge", opts.codeChallenge);
    params.set("code_challenge_method", "S256");
  }
  return `${cfg.authorizeUrl}?${params.toString()}`;
}

function tokenRequestInit(network: NetworkId, body: URLSearchParams): RequestInit {
  const cfg = PROVIDERS[network];
  const app = env.social[network];
  const headers: Record<string, string> = {
    "content-type": "application/x-www-form-urlencoded",
    accept: "application/json",
  };
  if (cfg.clientAuth === "basic") {
    headers.authorization = `Basic ${Buffer.from(`${app.id}:${app.secret}`).toString("base64")}`;
  } else {
    body.set("client_secret", app.secret ?? "");
  }
  return { method: "POST", headers, body };
}

export async function exchangeCodeForTokens(
  network: NetworkId,
  opts: { code: string; codeVerifier?: string },
): Promise<OAuthTokens> {
  const app = env.social[network];
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: opts.code,
    redirect_uri: oauthRedirectUri(network),
    client_id: app.id ?? "",
  });
  if (PROVIDERS[network].pkce && opts.codeVerifier) body.set("code_verifier", opts.codeVerifier);

  const res = await fetch(PROVIDERS[network].tokenUrl, tokenRequestInit(network, body));
  const json = (await res.json()) as any;
  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description || json.error || `token exchange failed (${res.status})`);
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresIn: Number(json.expires_in ?? 3600),
    scope: json.scope,
  };
}

export async function refreshAccessToken(
  network: NetworkId,
  refreshToken: string,
): Promise<OAuthTokens> {
  const app = env.social[network];
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: app.id ?? "",
  });
  const res = await fetch(PROVIDERS[network].tokenUrl, tokenRequestInit(network, body));
  const json = (await res.json()) as any;
  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description || json.error || `refresh failed (${res.status})`);
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? refreshToken,
    expiresIn: Number(json.expires_in ?? 3600),
  };
}

export async function fetchProfile(
  network: NetworkId,
  accessToken: string,
): Promise<ConnectProfile> {
  const cfg = PROVIDERS[network];
  if (!cfg.profileUrl) return { handle: "you", displayName: "Your channel" };
  try {
    const res = await fetch(cfg.profileUrl, { headers: { authorization: `Bearer ${accessToken}` } });
    if (!res.ok) return { handle: "you", displayName: "Your channel" };
    return cfg.parseProfile?.(await res.json()) ?? { handle: "you", displayName: "Your channel" };
  } catch {
    return { handle: "you", displayName: "Your channel" };
  }
}

/* -------------------------------------------------------------------------- */
/*  Signed OAuth state cookie                                                  */
/* -------------------------------------------------------------------------- */

const stateSecret = new TextEncoder().encode(env.jwtSecret);

export interface OAuthStatePayload {
  userId: string;
  network: NetworkId;
  state: string;
  codeVerifier?: string;
}

export async function signOAuthState(payload: OAuthStatePayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(stateSecret);
}

export async function verifyOAuthState(token: string): Promise<OAuthStatePayload | null> {
  try {
    const { payload } = await jwtVerify(token, stateSecret);
    return payload as unknown as OAuthStatePayload;
  } catch {
    return null;
  }
}

export const OAUTH_COOKIE = "aetheria_oauth";
