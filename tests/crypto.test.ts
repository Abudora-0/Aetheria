import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("token crypto", () => {
  it("round trips through the reversible fallback when no key is set", async () => {
    vi.resetModules();
    const { encryptToken, decryptToken } = await import("@/lib/crypto");
    const payload = encryptToken("access-token-123");
    expect(payload.startsWith("plain:")).toBe(true);
    expect(decryptToken(payload)).toBe("access-token-123");
  });

  it("round trips with AES-256-GCM when TOKEN_ENC_KEY is a 64 char hex", async () => {
    vi.stubEnv("TOKEN_ENC_KEY", "a".repeat(64));
    vi.resetModules();
    const { encryptToken, decryptToken } = await import("@/lib/crypto");
    const cipher = encryptToken("secret-value");
    expect(cipher.startsWith("v1:")).toBe(true);
    expect(cipher).not.toContain("secret-value");
    expect(decryptToken(cipher)).toBe("secret-value");
  });

  it("rejects a tampered ciphertext", async () => {
    vi.stubEnv("TOKEN_ENC_KEY", "b".repeat(64));
    vi.resetModules();
    const { encryptToken, decryptToken } = await import("@/lib/crypto");
    const cipher = encryptToken("value");
    const tampered = cipher.slice(0, -4) + "AAAA";
    expect(() => decryptToken(tampered)).toThrow();
  });
});
