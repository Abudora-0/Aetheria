import { beforeEach, describe, expect, it } from "vitest";
import { rateLimit, resetRateLimit, clientIp } from "@/lib/rate-limit";

beforeEach(() => resetRateLimit());

describe("rateLimit", () => {
  it("allows requests up to the limit then blocks", () => {
    for (let i = 0; i < 3; i++) {
      expect(rateLimit("k", 3, 1000).ok).toBe(true);
    }
    const blocked = rateLimit("k", 3, 1000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("scopes counts per key", () => {
    rateLimit("a", 1, 1000);
    expect(rateLimit("a", 1, 1000).ok).toBe(false);
    expect(rateLimit("b", 1, 1000).ok).toBe(true);
  });

  it("resets after the window elapses", async () => {
    rateLimit("w", 1, 20);
    expect(rateLimit("w", 1, 20).ok).toBe(false);
    await new Promise((r) => setTimeout(r, 30));
    expect(rateLimit("w", 1, 20).ok).toBe(true);
  });

  it("reads the first x-forwarded-for hop", () => {
    const req = new Request("https://x.test", {
      headers: { "x-forwarded-for": "203.0.113.9, 10.0.0.1" },
    });
    expect(clientIp(req)).toBe("203.0.113.9");
  });
});
