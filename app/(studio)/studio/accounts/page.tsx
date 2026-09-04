import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getAccountsForUser } from "@/lib/data/request-cache";
import { adapterStatus } from "@/lib/social";
import { PageHeader } from "@/components/studio/primitives";
import { TokenVault } from "@/components/studio/token-vault";

export const metadata: Metadata = { title: "Channels" };
export const dynamic = "force-dynamic";

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string; mode?: string }>;
}) {
  const user = (await getCurrentUser())!;
  const accounts = await getAccountsForUser(user.id);
  const params = await searchParams;

  return (
    <div>
      <PageHeader
        title="Token Vault"
        description="Connected channels, token health and auto refresh status. Tokens are stored encrypted with AES-256-GCM."
      />
      <TokenVault
        accounts={accounts}
        adapters={adapterStatus()}
        notice={{ connected: params.connected, error: params.error, mode: params.mode }}
      />
    </div>
  );
}
