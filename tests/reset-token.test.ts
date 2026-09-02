import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetDemoStore, demoStore } from "@/lib/data/demo-store";
import { getData } from "@/lib/data";
import { generateResetToken, hashResetToken } from "@/lib/auth/reset-token";
import { DEMO_USER } from "@/lib/demo/generate";

beforeEach(() => resetDemoStore());

describe("reset token helpers", () => {
  it("hashes deterministically and differently from the raw token", () => {
    const { token, hash } = generateResetToken();
    expect(hash).toBe(hashResetToken(token));
    expect(hash).not.toBe(token);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("password reset via the data port", () => {
  it("issues a token for a known email and consumes it once", async () => {
    const data = await getData();
    const issued = await data.users.createResetToken(DEMO_USER.email);
    expect(issued).not.toBeNull();

    const userId = await data.users.consumeResetToken(issued!.token);
    expect(userId).toBeTruthy();

    // second use is rejected
    expect(await data.users.consumeResetToken(issued!.token)).toBeNull();
  });

  it("returns null for an unknown email", async () => {
    const data = await getData();
    expect(await data.users.createResetToken("nobody@nowhere.test")).toBeNull();
  });

  it("rejects an expired token", async () => {
    const data = await getData();
    const issued = await data.users.createResetToken(DEMO_USER.email);
    const entry = demoStore().resets.at(-1)!;
    entry.expiresAt = Date.now() - 1000;
    expect(await data.users.consumeResetToken(issued!.token)).toBeNull();
  });

  it("updates the stored password hash", async () => {
    const data = await getData();
    await data.users.updatePassword(DEMO_USER.id, "new-hash-value");
    const user = demoStore().users.find((u) => u.id === DEMO_USER.id);
    expect(user?.passwordHash).toBe("new-hash-value");
    vi.restoreAllMocks();
  });
});
