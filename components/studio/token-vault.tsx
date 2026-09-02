"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { formatDistanceToNowStrict } from "date-fns";
import { Loader2, Plug, RefreshCw, ShieldCheck, Unplug } from "lucide-react";
import { useEffect, useState } from "react";
import { NETWORKS, NETWORK_LIST, type NetworkId } from "@/lib/constants";
import type { AccountRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

const STATUS_TONE = {
  healthy: "var(--aurora-teal)",
  expiring: "var(--aurora-gold)",
  revoked: "var(--danger)",
} as const;

const OAUTH_ERRORS: Record<string, string> = {
  channel_limit: "You have reached your plan's channel limit",
  invalid_oauth_state: "The connection could not be verified, try again",
  unknown_network: "That network is not supported",
  access_denied: "You cancelled the connection",
  oauth_failed: "The network rejected the connection",
  rate_limited: "Too many connection attempts, wait a minute",
};

export function TokenVault({
  accounts,
  adapters,
  notice,
}: {
  accounts: AccountRecord[];
  adapters: { network: NetworkId; name: string; live: boolean }[];
  notice?: { connected?: string; error?: string; mode?: string };
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const connectedIds = new Set(accounts.map((a) => a.network));

  useEffect(() => {
    if (!notice?.connected && !notice?.error) return;
    if (notice.connected) {
      const name = NETWORKS[notice.connected as NetworkId]?.name ?? notice.connected;
      toast.success(
        `${name} connected`,
        notice.mode === "sandbox" ? "Sandbox channel, no OAuth app configured" : undefined,
      );
    } else if (notice.error) {
      toast.error(OAUTH_ERRORS[notice.error] ?? decodeURIComponent(notice.error));
    }
    router.replace("/studio/accounts");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notice?.connected, notice?.error]);

  function connect(network: NetworkId) {
    setBusy(network);
    // A full navigation is required: this hits an API route that server-redirects
    // to the provider's OAuth screen, not a client-navigable page.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`/api/oauth/${network}/authorize`);
  }

  async function act(id: string, method: string, label: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/accounts/${id}`, { method });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed");
        return;
      }
      toast.success(label);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <AnimatePresence initial={false}>
          {accounts.map((a) => {
            const meta = NETWORKS[a.network];
            return (
              <motion.div
                key={a.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="panel card-interactive p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="grid h-10 w-10 place-items-center rounded-full"
                      style={{ background: `color-mix(in oklab, ${meta.accent} 20%, transparent)` }}
                    >
                      <meta.icon size={17} style={{ color: meta.accent }} />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">{meta.name}</p>
                      <p className="text-xs text-[var(--faint-foreground)]">
                        {meta.handlePrefix}
                        {a.handle}
                      </p>
                    </div>
                  </div>
                  <Badge tone={STATUS_TONE[a.status]} dot pulse={a.status === "expiring"}>
                    {a.status}
                  </Badge>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-[var(--faint-foreground)]">Followers</dt>
                    <dd className="font-mono text-[var(--foreground)]">
                      {a.followers.toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--faint-foreground)]">Token expires</dt>
                    <dd className="font-mono text-[var(--foreground)]">
                      {formatDistanceToNowStrict(new Date(a.tokenExpiresAt), { addSuffix: true })}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-[var(--faint-foreground)]">Last refreshed</dt>
                    <dd className="font-mono text-[var(--foreground)]">
                      {a.lastRefreshedAt
                        ? formatDistanceToNowStrict(new Date(a.lastRefreshedAt), { addSuffix: true })
                        : "never"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    magnetic={false}
                    onClick={() => act(a.id, "POST", "Token refreshed")}
                    disabled={busy === a.id}
                  >
                    {busy === a.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <RefreshCw size={13} />
                    )}
                    Refresh token
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    magnetic={false}
                    onClick={() => act(a.id, "DELETE", `${meta.name} disconnected`)}
                    disabled={busy === a.id}
                  >
                    <Unplug size={13} />
                    Disconnect
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <section className="panel p-5">
        <h2 className="mb-1 text-sm font-medium text-[var(--muted-foreground)]">Add a channel</h2>
        <p className="mb-4 flex items-center gap-1.5 text-xs text-[var(--faint-foreground)]">
          <ShieldCheck size={12} /> OAuth flows run live when app credentials are configured, otherwise
          a sandbox channel is created.
        </p>
        <div className="flex flex-wrap gap-2">
          {NETWORK_LIST.map((n) => {
            const already = connectedIds.has(n.id);
            const adapter = adapters.find((a) => a.network === n.id);
            return (
              <button
                key={n.id}
                disabled={already || busy === n.id}
                onClick={() => connect(n.id)}
                className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-strong)] px-3 py-2 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--bg-raise)] disabled:opacity-40"
              >
                {busy === n.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Plug size={14} style={{ color: n.accent }} />
                )}
                {n.name}
                <span className="text-[0.6rem] text-[var(--faint-foreground)]">
                  {adapter?.live ? "live" : "sandbox"}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
