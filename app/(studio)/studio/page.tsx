import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getData } from "@/lib/data";
import { getAnalytics } from "@/lib/analytics/service";
import { PageHeader, StatTile } from "@/components/studio/primitives";
import { StreamChart } from "@/components/charts/stream-chart";
import { UpcomingSignals } from "@/components/studio/upcoming-signals";
import { GoldenWindows } from "@/components/studio/golden-windows";
import { ButtonLink } from "@/components/ui/button";
import { NETWORKS } from "@/lib/constants";

export const metadata: Metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const user = (await getCurrentUser())!;
  const data = await getData();
  const [posts, analytics, accounts] = await Promise.all([
    data.posts.listByUser(user.id),
    getAnalytics(user.id, 60, user.timezone),
    data.accounts.listByUser(user.id),
  ]);

  const upcoming = posts
    .filter((p) => p.status === "scheduled" || p.status === "publishing")
    .sort((a, b) => (a.scheduledFor ?? "").localeCompare(b.scheduledFor ?? ""))
    .slice(0, 5);
  const published = posts.filter((p) => p.status === "published").length;

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="Your aether at a glance. The worker keeps running while this tab is closed."
        action={
          <ButtonLink href="/studio/compose" size="sm">
            New draft
          </ButtonLink>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Impressions, 60 days"
          value={analytics.totals.impressions}
          spark={analytics.velocity}
          delta={analytics.totals.growthRate}
        />
        <StatTile
          label="Engagement rate"
          value={analytics.totals.engagementRate * 100}
          format="percent"
        />
        <StatTile label="Cadence score" value={analytics.totals.cadenceScore} format="plain" />
        <StatTile label="Signals published" value={published} format="plain" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="panel p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-[var(--muted-foreground)]">Impression growth</h2>
            <Link
              href="/studio/analytics"
              className="flex items-center gap-1 text-xs text-[var(--aurora-violet)] hover:underline"
            >
              Full analytics <ArrowUpRight size={12} />
            </Link>
          </div>
          <StreamChart data={analytics.growth} />
        </section>

        <GoldenWindows windows={analytics.goldenWindows} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <UpcomingSignals posts={upcoming} />

        <section className="panel p-5">
          <h2 className="mb-4 text-sm font-medium text-[var(--muted-foreground)]">Channels</h2>
          <div className="space-y-2.5">
            {accounts.length === 0 ? (
              <p className="text-sm text-[var(--faint-foreground)]">
                No channels yet.{" "}
                <Link href="/studio/accounts" className="text-[var(--foreground)] underline">
                  Connect one
                </Link>
                .
              </p>
            ) : (
              accounts.map((a) => {
                const meta = NETWORKS[a.network];
                return (
                  <div key={a.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <meta.icon size={15} style={{ color: meta.accent }} />
                      {meta.name}
                    </span>
                    <span
                      className="text-xs"
                      style={{
                        color:
                          a.status === "healthy"
                            ? "var(--aurora-teal)"
                            : a.status === "expiring"
                              ? "var(--aurora-gold)"
                              : "var(--danger)",
                      }}
                    >
                      {a.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
