"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NETWORKS } from "@/lib/constants";
import type { GoldenWindow, PostRecord } from "@/lib/types";
import { Dialog } from "@/components/ui/dialog";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/** Polar to cartesian around a centre, rounded so SSR and client agree. */
function polar(center: number, degrees: number, radius: number) {
  const rad = ((degrees - 90) * Math.PI) / 180;
  return {
    x: Number((center + Math.cos(rad) * radius).toFixed(2)),
    y: Number((center + Math.sin(rad) * radius).toFixed(2)),
  };
}

export function TheDial({
  posts,
  goldenWindows,
  timezone,
}: {
  posts: PostRecord[];
  goldenWindows: GoldenWindow[];
  timezone: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [weekOffset, setWeekOffset] = useState(0);
  const [editing, setEditing] = useState<PostRecord | null>(null);
  const [when, setWhen] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const weekStart = useMemo(
    () => addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset * 7),
    [weekOffset],
  );
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const today = new Date();
  const todayPosts = posts
    .filter((p) => p.scheduledFor && isSameDay(new Date(p.scheduledFor), today))
    .sort((a, b) => a.scheduledFor!.localeCompare(b.scheduledFor!));

  async function reschedule() {
    if (!editing || !when) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/posts/${editing.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "reschedule", scheduledFor: when.toISOString() }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not reschedule");
        return;
      }
      toast.success("Moved on The Dial");
      setEditing(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <section className="panel flex flex-col items-center p-6">
        <h2 className="self-start text-sm font-medium text-[var(--muted-foreground)]">
          Today, {format(today, "EEEE d")}
        </h2>
        <div className="relative my-4 h-56 w-56">
          <svg viewBox="0 0 200 200" className="h-full w-full">
            <circle cx="100" cy="100" r="86" fill="none" stroke="var(--border)" strokeWidth="1" />
            <circle cx="100" cy="100" r="60" fill="none" stroke="var(--border)" strokeWidth="1" strokeDasharray="2 4" />
            {Array.from({ length: 24 }).map((_, h) => {
              const p = polar(100, (h / 24) * 360, 96);
              return (
                <text
                  key={h}
                  x={p.x}
                  y={p.y + 3}
                  textAnchor="middle"
                  className="fill-[var(--faint-foreground)] font-mono"
                  style={{ fontSize: 6 }}
                >
                  {h % 6 === 0 ? String(h).padStart(2, "0") : ""}
                </text>
              );
            })}
            {goldenWindows.map((w, i) => {
              const p = polar(100, (w.hour / 24) * 360, 73);
              return <circle key={i} cx={p.x} cy={p.y} r={3} fill="var(--aurora-gold)" opacity={0.5} />;
            })}
            {todayPosts.map((post, i) => {
              const d = new Date(post.scheduledFor!);
              const p = polar(100, ((d.getHours() + d.getMinutes() / 60) / 24) * 360, 60);
              return (
                <motion.circle
                  key={post.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.06, type: "spring" }}
                  cx={p.x}
                  cy={p.y}
                  r={5}
                  fill="var(--aurora-violet)"
                />
              );
            })}
            {mounted ? <NowHand /> : null}
          </svg>
        </div>
        {todayPosts.length === 0 ? (
          <p className="text-xs text-[var(--faint-foreground)]">Nothing scheduled today.</p>
        ) : (
          <ul className="w-full space-y-1.5">
            {todayPosts.map((p) => (
              <li key={p.id} className="flex items-center justify-between text-xs">
                <span className="truncate text-[var(--muted-foreground)]">{p.title}</span>
                <span className="font-mono text-[var(--foreground)]">
                  {format(new Date(p.scheduledFor!), "HH:mm")}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[0.65rem] text-[var(--faint-foreground)]">
          Gold dots are golden windows ({timezone})
        </p>
      </section>

      <section className="panel p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="rounded-md p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-[var(--foreground)]">
            {format(weekStart, "d MMM")} - {format(addDays(weekStart, 6), "d MMM")}
          </span>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="rounded-md p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {days.map((day) => {
            const dayPosts = posts
              .filter((p) => p.scheduledFor && isSameDay(new Date(p.scheduledFor), day))
              .sort((a, b) => a.scheduledFor!.localeCompare(b.scheduledFor!));
            const isToday = isSameDay(day, today);
            return (
              <div
                key={day.toISOString()}
                className={`min-h-[140px] rounded-[var(--radius-md)] border p-2 ${
                  isToday ? "border-[var(--aurora-violet)]" : "border-[var(--border)]"
                }`}
              >
                <p className="mb-2 text-[0.65rem] uppercase tracking-wide text-[var(--faint-foreground)]">
                  {format(day, "EEE d")}
                </p>
                <div className="space-y-1.5">
                  {dayPosts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setEditing(p);
                        setWhen(new Date(p.scheduledFor!));
                      }}
                      className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-raise)] p-1.5 text-left transition-colors hover:border-[var(--border-strong)]"
                    >
                      <span className="flex items-center gap-1">
                        {p.networks.slice(0, 3).map((n) => {
                          const meta = NETWORKS[n];
                          return <meta.icon key={n} size={9} style={{ color: meta.accent }} />;
                        })}
                        <span className="ml-auto font-mono text-[0.6rem] text-[var(--muted-foreground)]">
                          {format(new Date(p.scheduledFor!), "HH:mm")}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-[0.7rem] text-[var(--foreground)]">
                        {p.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Reschedule signal"
        description={editing?.title}
      >
        <DateTimePicker value={when} onChange={setWhen} minDate={new Date()} />
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" magnetic={false} onClick={() => setEditing(null)}>
            Cancel
          </Button>
          <Button magnetic={false} onClick={reschedule} disabled={saving}>
            {saving ? "Moving" : "Move signal"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function NowHand() {
  const d = new Date();
  const p = polar(100, ((d.getHours() + d.getMinutes() / 60) / 24) * 360, 82);
  return (
    <line
      x1="100"
      y1="100"
      x2={p.x}
      y2={p.y}
      stroke="var(--aurora-teal)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  );
}
