import { describe, expect, it } from "vitest";
import { buildVariants, overLimitNetworks, nextGoldenSlot } from "@/lib/posts/compose";
import { NETWORKS } from "@/lib/constants";

describe("composer helpers", () => {
  it("trims each variant to the network character limit", () => {
    const long = "x".repeat(400);
    const variants = buildVariants(long, ["twitter", "linkedin"]);
    const tw = variants.find((v) => v.network === "twitter")!;
    const li = variants.find((v) => v.network === "linkedin")!;
    expect(tw.body.length).toBeLessThanOrEqual(NETWORKS.twitter.charLimit);
    expect(li.body.length).toBe(400);
  });

  it("applies per network overrides", () => {
    const variants = buildVariants("base text", ["twitter", "linkedin"], {
      twitter: "short tweet",
    });
    expect(variants.find((v) => v.network === "twitter")!.body).toBe("short tweet");
    expect(variants.find((v) => v.network === "linkedin")!.body).toBe("base text");
  });

  it("flags networks the base text is too long for", () => {
    const over = overLimitNetworks("y".repeat(500), ["twitter", "linkedin"]);
    expect(over).toEqual(["twitter"]);
  });

  it("finds the next golden slot after now", () => {
    const base = new Date("2026-03-02T08:00:00Z"); // a Monday
    const slot = nextGoldenSlot(base, [{ day: 1, hour: 10 }]);
    expect(slot).not.toBeNull();
    expect(slot!.getDay()).toBe(1);
    expect(slot!.getHours()).toBe(10);
    expect(slot!.getTime()).toBeGreaterThan(base.getTime());
  });

  it("returns null when there are no golden windows", () => {
    expect(nextGoldenSlot(new Date(), [])).toBeNull();
  });
});
