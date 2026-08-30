import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getAnalytics } from "@/lib/analytics/service";
import { resolveDataMode } from "@/lib/env";
import { PageHeader } from "@/components/studio/primitives";
import { AnalyticsBoard } from "@/components/studio/analytics-board";

export const metadata: Metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const user = (await getCurrentUser())!;
  const bundle = await getAnalytics(user.id, 90, user.timezone);

  return (
    <div>
      <PageHeader
        title="Aurora Analytics"
        description="Impression growth, engagement rate and optimal timing, computed with MongoDB aggregation pipelines."
      />
      <AnalyticsBoard
        initial={bundle}
        engine={resolveDataMode() === "live" ? "MongoDB aggregation pipelines" : "aggregation-equivalent reducers (demo)"}
      />
    </div>
  );
}
