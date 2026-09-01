import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth/session";
import { getData } from "@/lib/data";
import { integrations, env } from "@/lib/env";
import { NETWORKS, PLANS, type NetworkId } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";
import {
  buildAuthorizeUrl,
  createPkcePair,
  providerConfig,
  signOAuthState,
  OAUTH_COOKIE,
} from "@/lib/social/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NETWORK_IDS = Object.keys(NETWORKS) as NetworkId[];

export async function GET(request: Request, ctx: { params: Promise<{ network: string }> }) {
  const { network } = await ctx.params;
  const origin = new URL(request.url).origin;
  const accountsUrl = (query: string) => NextResponse.redirect(new URL(`/studio/accounts?${query}`, origin));

  if (!NETWORK_IDS.includes(network as NetworkId)) {
    return accountsUrl("error=unknown_network");
  }
  const net = network as NetworkId;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/sign-in?next=/studio/accounts", origin));
  }

  if (!rateLimit(`oauth:${user.id}`, 12, 60_000).ok) {
    return accountsUrl("error=rate_limited");
  }

  const data = await getData();
  const sub = await data.subscription.forUser(user.id);
  const existing = await data.accounts.listByUser(user.id);
  if (
    !existing.some((a) => a.network === net) &&
    existing.length >= PLANS[sub.plan].limits.channels
  ) {
    return accountsUrl("error=channel_limit");
  }

  // No real OAuth app for this network: create a sandbox channel and return.
  if (!integrations.social(net)) {
    await data.accounts.connect(user.id, net);
    return accountsUrl(`connected=${net}&mode=sandbox`);
  }

  const state = crypto.randomBytes(16).toString("hex");
  const pkce = providerConfig(net).pkce ? createPkcePair() : null;
  const stateToken = await signOAuthState({
    userId: user.id,
    network: net,
    state,
    codeVerifier: pkce?.verifier,
  });

  const jar = await cookies();
  jar.set(OAUTH_COOKIE, stateToken, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return NextResponse.redirect(buildAuthorizeUrl(net, { state, codeChallenge: pkce?.challenge }));
}
