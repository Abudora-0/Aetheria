"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Check, Compass, ImagePlus, Loader2, Send, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { NETWORKS, NETWORK_LIST, type NetworkId } from "@/lib/constants";
import type { AccountRecord, GoldenWindow, MediaAsset, PostRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { ProgressRing } from "@/components/ui/progress-ring";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { useToast } from "@/components/ui/toast";
import { nextGoldenSlot } from "@/lib/posts/compose";
import { cn, compactNumber } from "@/lib/utils";
import { NetworkPreview } from "@/components/studio/network-preview";

export function Composer({
  accounts,
  goldenWindows,
  timezone,
  existing,
}: {
  accounts: AccountRecord[];
  goldenWindows: GoldenWindow[];
  timezone: string;
  existing: PostRecord | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const connected = accounts.map((a) => a.network);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [base, setBase] = useState(existing?.base ?? "");
  const [selected, setSelected] = useState<NetworkId[]>(
    existing?.networks ?? (connected.length ? [connected[0]] : []),
  );
  const [media, setMedia] = useState<MediaAsset[]>(existing?.media ?? []);
  const [when, setWhen] = useState<Date | null>(
    existing?.scheduledFor ? new Date(existing.scheduledFor) : null,
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState<"draft" | "schedule" | null>(null);

  const overLimit = useMemo(
    () => selected.filter((n) => base.trim().length > NETWORKS[n].charLimit),
    [selected, base],
  );

  function toggleNetwork(n: NetworkId) {
    setSelected((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));
  }

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files).slice(0, 4)) {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const json = await res.json();
        if (res.ok) setMedia((m) => [...m, json.data.asset]);
        else toast.error(json.error ?? "Upload failed");
      }
    } finally {
      setUploading(false);
    }
  }

  async function submit(action: "draft" | "schedule") {
    if (!base.trim()) return toast.error("Write something first");
    if (selected.length === 0) return toast.error("Pick at least one channel");
    if (action === "schedule" && !when) return toast.error("Pick a time on The Dial");

    setSaving(action);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: existing?.id,
          title: title.trim() || undefined,
          base,
          networks: selected,
          media,
          scheduledFor: when ? when.toISOString() : null,
          action,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not save");
        return;
      }
      toast.success(action === "schedule" ? "Signal scheduled" : "Draft saved");
      router.push(action === "schedule" ? "/studio/queue" : "/studio/compose");
      router.refresh();
    } finally {
      setSaving(null);
    }
  }

  function applyGolden() {
    const slot = nextGoldenSlot(new Date(), goldenWindows);
    if (slot) {
      setWhen(slot);
      toast.info("Snapped to your next golden window", slot.toLocaleString());
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-4">
        <div className="panel p-5">
          <Field label="Internal title" className="mb-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Launch week teaser"
            />
          </Field>

          <Field label="Message">
            <textarea
              value={base}
              onChange={(e) => setBase(e.target.value)}
              placeholder="What do you want to send into the aether?"
              className="min-h-[190px] w-full resize-y rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raise)] p-3.5 text-sm leading-relaxed outline-none transition-colors focus-visible:border-[var(--aurora-violet)]"
            />
          </Field>

          {media.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {media.map((m) => (
                <div key={m.id} className="group relative h-20 w-20 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.url} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() => setMedia((list) => list.filter((x) => x.id !== m.id))}
                    className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              multiple
              hidden
              onChange={(e) => onFiles(e.target.files)}
            />
            <Button
              variant="outline"
              size="sm"
              magnetic={false}
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
              Media
            </Button>
            {NETWORK_LIST.map((n) => {
              const isConnected = connected.includes(n.id);
              const isOn = selected.includes(n.id);
              return (
                <motion.button
                  key={n.id}
                  type="button"
                  disabled={!isConnected}
                  onClick={() => toggleNetwork(n.id)}
                  title={isConnected ? n.name : `Connect ${n.name} first`}
                  whileTap={{ scale: 0.94 }}
                  animate={{ scale: isOn ? 1.03 : 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors disabled:opacity-35",
                    isOn
                      ? "border-transparent text-[#07080d]"
                      : "border-[var(--border-strong)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
                  )}
                  style={isOn ? { background: n.accent } : undefined}
                >
                  {isOn ? <Check size={13} strokeWidth={3} /> : <n.icon size={13} />}
                  {n.name}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-[var(--muted-foreground)]">Schedule</h2>
            <button
              onClick={applyGolden}
              className="flex items-center gap-1.5 text-xs text-[var(--aurora-gold)] hover:underline"
            >
              <Compass size={13} /> Snap to golden window
            </button>
          </div>
          <DateTimePicker value={when} onChange={setWhen} minDate={new Date()} />
          {goldenWindows.length > 0 ? (
            <p className="mt-2 text-xs text-[var(--faint-foreground)]">
              Your aether favours {goldenWindows.map((w) => w.label).join(", ")} ({timezone}).
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={() => submit("schedule")} disabled={saving !== null}>
              {saving === "schedule" ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {when ? "Schedule signal" : "Schedule"}
            </Button>
            <Button variant="outline" magnetic={false} onClick={() => submit("draft")} disabled={saving !== null}>
              {saving === "draft" ? <Loader2 size={15} className="animate-spin" /> : null}
              Save draft
            </Button>
          </div>
          <AnimatePresence>
            {overLimit.length > 0 ? (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 text-xs text-[var(--danger)]"
              >
                Over the limit on {overLimit.map((n) => NETWORKS[n].name).join(", ")}. The variant will
                be trimmed on publish.
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-[var(--muted-foreground)]">Live previews</h2>
          <div className="flex gap-2">
            {selected.map((n) => {
              const len = base.trim().length;
              const limit = NETWORKS[n].charLimit;
              return (
                <ProgressRing
                  key={n}
                  value={len / limit}
                  size={34}
                  stroke={3}
                  label={compactNumber(Math.max(0, limit - len), 0)}
                  tone={NETWORKS[n].accent}
                />
              );
            })}
          </div>
        </div>
        {selected.length === 0 ? (
          <div className="panel grid place-items-center p-10 text-sm text-[var(--faint-foreground)]">
            Select a channel to preview
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {selected.map((n) => (
              <motion.div
                key={n}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
              >
                <NetworkPreview
                  network={n}
                  body={base}
                  media={media}
                  account={accounts.find((a) => a.network === n)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
