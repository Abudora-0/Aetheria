"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { CircleSlash, Loader2, Play, RotateCcw, Rocket } from "lucide-react";
import { useState } from "react";
import { NETWORKS, STATUS_META } from "@/lib/constants";
import type { PostRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Countdown } from "@/components/studio/countdown";

export function SignalQueue({
  queue,
  recent,
  demoMode,
}: {
  queue: PostRecord[];
  recent: PostRecord[];
  demoMode: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  async function action(url: string, method: string, body?: unknown, key = url) {
    setBusy(key);
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Action failed");
        return null;
      }
      router.refresh();
      return json.data;
    } finally {
      setBusy(null);
    }
  }

  async function runWorker() {
    const data = await action("/api/worker/tick", "POST", undefined, "worker");
    if (data) {
      toast.success(
        `Worker tick complete`,
        `${data.published} published, ${data.failed} failed, ${data.claimed} claimed`,
      );
    }
  }

  return (
    <div className="space-y-5">
      <div className="panel flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm text-[var(--foreground)]">
            {queue.length} signal{queue.length === 1 ? "" : "s"} waiting
          </p>
          <p className="text-xs text-[var(--faint-foreground)]">
            {demoMode
              ? "Demo mode: run the worker manually to publish now."
              : "A Vercel cron ticks the worker every minute."}
          </p>
        </div>
        <Button size="sm" onClick={runWorker} disabled={busy === "worker"} magnetic={false}>
          {busy === "worker" ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          Run worker now
        </Button>
      </div>

      <div className="space-y-2.5">
        <AnimatePresence initial={false}>
          {queue.map((p) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -12 }}
              className="panel card-interactive flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
            >
              <div className="flex -space-x-1.5">
                {p.networks.map((n) => {
                  const meta = NETWORKS[n];
                  return (
                    <span
                      key={n}
                      className="grid h-7 w-7 place-items-center rounded-full border border-[var(--bg-raise)] bg-[var(--bg-sink)]"
                    >
                      <meta.icon size={12} style={{ color: meta.accent }} />
                    </span>
                  );
                })}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-[var(--foreground)]">{p.title}</p>
                <p className="truncate text-xs text-[var(--faint-foreground)]">{p.base}</p>
                {p.failureReason ? (
                  <p className="mt-1 text-xs text-[var(--danger)]">{p.failureReason}</p>
                ) : null}
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-xs" style={{ color: STATUS_META[p.status].tone }}>
                    {STATUS_META[p.status].label}
                  </span>
                  {p.status === "publishing" ? (
                    <p className="flex items-center gap-1 text-xs text-[var(--aurora-gold)]">
                      <span className="h-1.5 w-1.5 animate-[aether-pulse_1.2s_ease-in-out_infinite] rounded-full bg-[var(--aurora-gold)]" />
                      working
                    </p>
                  ) : p.nextAttemptAt || p.scheduledFor ? (
                    <Countdown target={p.nextAttemptAt ?? p.scheduledFor!} />
                  ) : null}
                </div>

                <div className="flex gap-1">
                  {p.status !== "publishing" ? (
                    <button
                      title="Publish now"
                      onClick={() => action(`/api/posts/${p.id}/publish-now`, "POST", undefined, p.id)}
                      disabled={busy === p.id}
                      className="rounded-md border border-[var(--border)] p-1.5 text-[var(--muted-foreground)] transition-colors hover:text-[var(--aurora-teal)]"
                    >
                      {busy === p.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Rocket size={13} />
                      )}
                    </button>
                  ) : null}
                  {p.status === "failed" ? (
                    <button
                      title="Retry"
                      onClick={() =>
                        action(`/api/posts/${p.id}`, "PATCH", {
                          action: "reschedule",
                          scheduledFor: new Date().toISOString(),
                        }, p.id)
                      }
                      className="rounded-md border border-[var(--border)] p-1.5 text-[var(--muted-foreground)] hover:text-[var(--aurora-violet)]"
                    >
                      <RotateCcw size={13} />
                    </button>
                  ) : null}
                  <button
                    title="Cancel"
                    onClick={() => action(`/api/posts/${p.id}`, "PATCH", { action: "cancel" }, p.id)}
                    className="rounded-md border border-[var(--border)] p-1.5 text-[var(--muted-foreground)] hover:text-[var(--danger)]"
                  >
                    <CircleSlash size={13} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {queue.length === 0 ? (
          <div className="panel grid place-items-center p-12 text-sm text-[var(--faint-foreground)]">
            The queue is empty. Draft something in the Composer.
          </div>
        ) : null}
      </div>

      {recent.length > 0 ? (
        <section className="panel p-5">
          <h2 className="mb-3 text-sm font-medium text-[var(--muted-foreground)]">Recently processed</h2>
          <ul className="divide-y divide-[var(--border)]">
            {recent.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="truncate text-[var(--muted-foreground)]">{p.title}</span>
                <span className="text-xs" style={{ color: STATUS_META[p.status].tone }}>
                  {STATUS_META[p.status].label}
                  {p.status === "published" && p.publishedAt
                    ? ` ${new Date(p.publishedAt).toLocaleDateString()}`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
