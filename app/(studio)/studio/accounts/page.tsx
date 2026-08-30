import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getData } from "@/lib/data";
import { adapterStatus } from "@/lib/social";
import { PageHeader } from "@/components/studio/primitives";
import { TokenVault } from "@/components/studio/token-vault";

export const metadata: Metadata = { title: "Channels" };
export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const user = (await getCurrentUser())!;
  const data = await getData();
  const accounts = await data.accounts.listByUser(user.id);

  return (
    <div>
      <PageHeader
        title="Token Vault"
        description="Connected channels, token health and auto refresh status. Tokens are stored encrypted with AES-256-GCM."
      />
      <TokenVault accounts={accounts} adapters={adapterStatus()} />
    </div>
  );
}
