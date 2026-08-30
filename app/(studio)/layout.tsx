import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getData } from "@/lib/data";
import { resolveDataMode } from "@/lib/env";
import { StudioShell } from "@/components/studio/studio-shell";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/studio");

  const data = await getData();
  const [subscription, accounts] = await Promise.all([
    data.subscription.forUser(user.id),
    data.accounts.listByUser(user.id),
  ]);

  return (
    <StudioShell
      user={user}
      plan={subscription.plan}
      accountCount={accounts.length}
      dataMode={resolveDataMode()}
    >
      {children}
    </StudioShell>
  );
}
