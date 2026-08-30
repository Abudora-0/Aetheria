"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SectionCard } from "@/components/studio/primitives";
import { Field, Input } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useTheme } from "@/components/system/theme-provider";
import { useMotionPrefs } from "@/components/system/motion-prefs";
import type { SessionUser } from "@/lib/types";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Australia/Sydney",
  "UTC",
];

export function SettingsPanel({ user }: { user: SessionUser }) {
  const router = useRouter();
  const toast = useToast();
  const { theme, setTheme } = useTheme();
  const { reduced, systemReduced, setReduced } = useMotionPrefs();

  const [name, setName] = useState(user.name);
  const [timezone, setTimezone] = useState(user.timezone);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, timezone }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not save");
        return;
      }
      toast.success("Profile updated");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SectionCard title="Profile">
        <div className="space-y-4">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Email">
            <Input value={user.email} disabled />
          </Field>
          <Select
            label="Timezone"
            value={timezone}
            onChange={setTimezone}
            options={TIMEZONES.map((t) => ({ value: t, label: t.replace("_", " ") }))}
          />
          <Button magnetic={false} onClick={save} disabled={saving}>
            {saving ? "Saving" : "Save changes"}
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Appearance and motion">
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-medium text-[var(--muted-foreground)]">Theme</p>
            <div className="flex gap-2">
              {(["dark", "light"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`rounded-[var(--radius-md)] border px-4 py-2 text-sm capitalize transition-colors ${
                    theme === t
                      ? "border-[var(--aurora-violet)] text-[var(--foreground)]"
                      : "border-[var(--border)] text-[var(--muted-foreground)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-[var(--foreground)]">Reduce motion</p>
              <p className="text-xs text-[var(--faint-foreground)]">
                Stops the aether field, parallax and long transitions.
                {systemReduced ? " Your OS already requests this." : ""}
              </p>
            </div>
            <Switch checked={reduced} onChange={setReduced} />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
