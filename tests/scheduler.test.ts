import { beforeEach, describe, expect, it } from "vitest";
import { resetDemoStore } from "@/lib/data/demo-store";
import { getData } from "@/lib/data";
import { runPublishTick } from "@/lib/queue/scheduler";
import { DEMO_USER } from "@/lib/demo/generate";
import type { NetworkId } from "@/lib/constants";

beforeEach(() => resetDemoStore());

function dueDraft(base: string, networks: NetworkId[]) {
  return {
    title: "test signal",
    base,
    networks,
    variants: networks.map((network) => ({ network, body: base })),
    media: [],
    scheduledFor: new Date(Date.now() - 5000).toISOString(),
    status: "scheduled" as const,
  };
}

describe("publish worker", () => {
  it("publishes a due post and records a result per network", async () => {
    const data = await getData();
    const post = await data.posts.save(DEMO_USER.id, dueDraft("hello world", ["twitter", "linkedin"]));

    await runPublishTick(new Date());

    const updated = await data.posts.findById(DEMO_USER.id, post.id);
    expect(updated?.status).toBe("published");
    expect(updated?.publishedAt).toBeTruthy();
    expect(updated?.results.filter((r) => r.ok).length).toBe(2);
  });

  it("marks a failed publish for retry with a backoff time", async () => {
    const data = await getData();
    const post = await data.posts.save(DEMO_USER.id, dueDraft("FORCE_FAIL now", ["twitter"]));

    await runPublishTick(new Date());

    const updated = await data.posts.findById(DEMO_USER.id, post.id);
    expect(updated?.status).toBe("failed");
    expect(updated?.attempts).toBe(1);
    expect(updated?.failureReason).toContain("twitter");
    expect(updated?.nextAttemptAt).toBeTruthy();
  });

  it("claims each job once when two ticks race", async () => {
    const data = await getData();
    const post = await data.posts.save(DEMO_USER.id, dueDraft("race safe", ["twitter"]));

    await Promise.all([runPublishTick(new Date()), runPublishTick(new Date())]);

    const updated = await data.posts.findById(DEMO_USER.id, post.id);
    expect(updated?.status).toBe("published");
    expect(updated?.attempts).toBe(1);
  });
});
