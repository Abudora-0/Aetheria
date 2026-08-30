"use client";

import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { NETWORKS } from "@/lib/constants";
import { STATUS_META } from "@/lib/constants";
import type { PostRecord } from "@/lib/types";

export function UpcomingSignals({ posts }: { posts: PostRecord[] }) {
  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-[var(--muted-foreground)]">Next in the queue</h2>
        <Link href="/studio/queue" className="text-xs text-[var(--aurora-violet)] hover:underline">
          View all
        </Link>
      </div>
      {posts.length === 0 ? (
        <p className="text-sm text-[var(--faint-foreground)]">
          Nothing scheduled. The aether is quiet.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {posts.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex -space-x-1.5">
                {p.networks.map((n) => {
                  const meta = NETWORKS[n];
                  return (
                    <span
                      key={n}
                      className="grid h-6 w-6 place-items-center rounded-full border border-[var(--bg-raise)] bg-[var(--bg-sink)]"
                    >
                      <meta.icon size={11} style={{ color: meta.accent }} />
                    </span>
                  );
                })}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-[var(--foreground)]">{p.title}</p>
                <p className="text-xs text-[var(--faint-foreground)]">
                  {p.scheduledFor
                    ? `in ${formatDistanceToNowStrict(new Date(p.scheduledFor))}`
                    : "unscheduled"}
                </p>
              </div>
              <span
                className="text-xs"
                style={{ color: STATUS_META[p.status].tone }}
              >
                {STATUS_META[p.status].label}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
