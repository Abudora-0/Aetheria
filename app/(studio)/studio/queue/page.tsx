import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getData } from "@/lib/data";
import { getPostsForUser } from "@/lib/data/request-cache";
import { PageHeader } from "@/components/studio/primitives";
import { SignalQueue } from "@/components/studio/signal-queue";

export const metadata: Metadata = { title: "Signal Queue" };
export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const user = (await getCurrentUser())!;
  const [data, posts] = await Promise.all([getData(), getPostsForUser(user.id)]);

  const queue = posts.filter((p) =>
    ["scheduled", "publishing", "failed"].includes(p.status),
  );
  const recent = posts
    .filter((p) => p.status === "published" || p.status === "cancelled")
    .slice(0, 8);

  return (
    <div>
      <PageHeader
        title="Signal Queue"
        description="Every job the worker is about to run, with live countdowns and one tap recovery."
      />
      <SignalQueue queue={queue} recent={recent} demoMode={data.mode === "demo"} />
    </div>
  );
}
