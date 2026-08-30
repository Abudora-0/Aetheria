import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/studio/primitives";
import { SettingsPanel } from "@/components/studio/settings-panel";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = (await getCurrentUser())!;
  return (
    <div>
      <PageHeader title="Settings" description="Your profile, timezone and how much the interface moves." />
      <SettingsPanel user={user} />
    </div>
  );
}
