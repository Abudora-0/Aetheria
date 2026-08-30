import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getData } from "@/lib/data";
import { getAnalytics } from "@/lib/analytics/service";
import { Composer } from "@/components/studio/composer";
import { PageHeader } from "@/components/studio/primitives";

export const metadata: Metadata = { title: "Composer" };
export const dynamic = "force-dynamic";

export default async function ComposePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const user = (await getCurrentUser())!;
  const data = await getData();
  const [accounts, analytics, existing] = await Promise.all([
    data.accounts.listByUser(user.id),
    getAnalytics(user.id, 90, user.timezone),
    id ? data.posts.findById(user.id, id) : Promise.resolve(null),
  ]);

  return (
    <div>
      <PageHeader
        title="Aether Composer"
        description="Write once. Aetheria forks a variant per network and shows you exactly how each one lands."
      />
      <Composer
        accounts={accounts}
        goldenWindows={analytics.goldenWindows}
        timezone={user.timezone}
        existing={existing}
      />
    </div>
  );
}
