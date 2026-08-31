import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getData } from "@/lib/data";
import { NETWORKS, type NetworkId } from "@/lib/constants";
import {
  exchangeCodeForTokens,
  fetchProfile,
  verifyOAuthState,
  OAUTH_COOKIE,
} from "@/lib/social/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NETWORK_IDS = Object.keys(NETWORKS) as NetworkId[];

export async function GET(request: Request, ctx: { params: Promise<{ network: string }> }) {
  const { network } = await ctx.params;
  const url = new URL(request.url);
  const back = (query: string) =>
    NextResponse.redirect(new URL(`/studio/accounts?${query}`, url.origin));

  const jar = await cookies();
  const stateToken = jar.get(OAUTH_COOKIE)?.value;
  jar.delete(OAUTH_COOKIE);

  const providerError = url.searchParams.get("error");
  if (providerError) {
    return back(`error=${encodeURIComponent(providerError)}`);
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const parsed = stateToken ? await verifyOAuthState(stateToken) : null;

  if (
    !code ||
    !state ||
    !parsed ||
    parsed.state !== state ||
    parsed.network !== network ||
    !NETWORK_IDS.includes(network as NetworkId)
  ) {
    return back("error=invalid_oauth_state");
  }
  const net = network as NetworkId;

  try {
    const tokens = await exchangeCodeForTokens(net, {
      code,
      codeVerifier: parsed.codeVerifier,
    });
    const profile = await fetchProfile(net, tokens.accessToken);
    const data = await getData();
    await data.accounts.connect(parsed.userId, net, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      handle: profile.handle,
      displayName: profile.displayName,
    });
    return back(`connected=${net}`);
  } catch (err) {
    return back(`error=${encodeURIComponent(err instanceof Error ? err.message : "oauth_failed")}`);
  }
}
