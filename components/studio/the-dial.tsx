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
import { useMotionPrefs } from "@/components/system/motion-prefs";
import { cn } from "@/lib/utils";

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
  const { reduced } = useMotionPrefs();
  const [weekOffset, setWeekOffset] = useState(0);
  const [editing, setEditing] = useState<PostRecord | null>(null);
  const [when, setWhen] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  useEffect(() => setMounted(true), []);

  async function rescheduleTo(postId: string, iso: string, successMsg = "Moved on The Dial") {
    const res = await fetch(`/api/posts/${postId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "reschedule", scheduledFor: iso }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(json.error ?? "Could not reschedule");
      return false;
    }
    toast.success(successMsg);
    router.refresh();
    return true;
  }

  async function dropOnDay(day: Date) {
    setDragOver(null);
    const id = dragId;
    setDragId(null);
    if (!id) return;
    const post = posts.find((p) => p.id === id);
    if (!post?.scheduledFor) return;
    const current = new Date(post.scheduledFor);
    if (isSameDay(current, day)) return;
    const next = new Date(day);
    next.setHours(current.getHours(), current.getMinutes(), 0, 0);
    if (next.getTime() < Date.now()) {
      toast.error("That day is in the past");
      return;
    }
    await rescheduleTo(id, next.toISOString(), `Moved to ${format(next, "EEE d, HH:mm")}`);
  }

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
      if (await rescheduleTo(editing.id, when.toISOString())) setEditing(null);
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

        {!reduced ? (
          <p className="mb-2 text-[0.65rem] text-[var(--faint-foreground)]">
            Drag a signal to another day, or tap it to set an exact time.
          </p>
        ) : null}

        <div className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:grid-cols-7 lg:overflow-visible">
          {days.map((day) => {
            const dayPosts = posts
              .filter((p) => p.scheduledFor && isSameDay(new Date(p.scheduledFor), day))
              .sort((a, b) => a.scheduledFor!.localeCompare(b.scheduledFor!));
            const isToday = isSameDay(day, today);
            const key = day.toISOString();
            return (
              <div
                key={key}
                onDragOver={(e) => {
                  if (reduced || !dragId) return;
                  e.preventDefault();
                  setDragOver(key);
                }}
                onDragLeave={() => setDragOver((d) => (d === key ? null : d))}
                onDrop={() => void dropOnDay(day)}
                className={cn(
                  "min-h-[144px] w-[132px] shrink-0 rounded-[var(--radius-md)] border p-2 transition-colors lg:w-auto",
                  dragOver === key
                    ? "border-[var(--aurora-teal)] bg-[color-mix(in_oklab,var(--aurora-teal)_10%,transparent)]"
                    : isToday
                      ? "border-[var(--aurora-violet)]"
                      : "border-[var(--border)]",
                )}
              >
                <p className="mb-2 text-[0.65rem] uppercase tracking-wide text-[var(--faint-foreground)]">
                  {format(day, "EEE d")}
                </p>
                <div className="space-y-1.5">
                  {dayPosts.map((p) => (
                    <button
                      key={p.id}
                      draggable={!reduced}
                      onDragStart={() => setDragId(p.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setDragOver(null);
                      }}
                      onClick={() => {
                        setEditing(p);
                        setWhen(new Date(p.scheduledFor!));
                      }}
                      className={cn(
                        "w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-raise)] p-1.5 text-left transition-all hover:border-[var(--border-strong)]",
                        !reduced && "cursor-grab active:cursor-grabbing",
                        dragId === p.id && "opacity-40",
                      )}
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
