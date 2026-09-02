import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getData } from "@/lib/data";
import { getAnalytics } from "@/lib/analytics/service";
import { PageHeader } from "@/components/studio/primitives";
import { TheDial } from "@/components/studio/the-dial";

export const metadata: Metadata = { title: "The Dial" };
export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const user = (await getCurrentUser())!;
  const data = await getData();
  const [posts, analytics] = await Promise.all([
    data.posts.listByUser(user.id),
    getAnalytics(user.id, 90, user.timezone),
  ]);

  const scheduled = posts.filter(
    (p) => (p.status === "scheduled" || p.status === "publishing" || p.status === "draft") && p.scheduledFor,
  );

  return (
    <div>
      <PageHeader
        title="The Dial"
        description="A radial read on today and a week you can rearrange. Drag a signal between days, or tap it for an exact time."
      />
      <TheDial posts={scheduled} goldenWindows={analytics.goldenWindows} timezone={user.timezone} />
    </div>
  );
}
