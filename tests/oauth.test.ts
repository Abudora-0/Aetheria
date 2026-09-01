import { describe, expect, it } from "vitest";
import {
  createPkcePair,
  signOAuthState,
  verifyOAuthState,
  buildAuthorizeUrl,
  oauthRedirectUri,
} from "@/lib/social/oauth";

describe("oauth helpers", () => {
  it("creates a valid S256 PKCE pair", () => {
    const { verifier, challenge } = createPkcePair();
    expect(verifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(challenge).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(challenge).not.toBe(verifier);
  });

  it("round trips a signed state payload", async () => {
    const token = await signOAuthState({
      userId: "u_1",
      network: "twitter",
      state: "abc",
      codeVerifier: "v",
    });
    const parsed = await verifyOAuthState(token);
    expect(parsed?.userId).toBe("u_1");
    expect(parsed?.network).toBe("twitter");
    expect(parsed?.state).toBe("abc");
  });

  it("rejects a tampered state token", async () => {
    const token = await signOAuthState({ userId: "u", network: "linkedin", state: "s" });
    const parsed = await verifyOAuthState(token.slice(0, -3) + "xxx");
    expect(parsed).toBeNull();
  });

  it("builds a spec compliant authorize URL", () => {
    const url = new URL(
      buildAuthorizeUrl("twitter", { state: "st4te", codeChallenge: "chal" }),
    );
    expect(url.origin + url.pathname).toBe("https://twitter.com/i/oauth2/authorize");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("state")).toBe("st4te");
    expect(url.searchParams.get("code_challenge")).toBe("chal");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("redirect_uri")).toBe(oauthRedirectUri("twitter"));
  });

  it("omits PKCE params for providers that do not use it", () => {
    const url = new URL(buildAuthorizeUrl("linkedin", { state: "s" }));
    expect(url.searchParams.has("code_challenge")).toBe(false);
    expect(url.searchParams.get("scope")).toContain("w_member_social");
  });
});
