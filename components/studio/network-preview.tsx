"use client";

import { Heart, MessageCircle, Repeat2, Share } from "lucide-react";
import { NETWORKS, type NetworkId } from "@/lib/constants";
import type { AccountRecord, MediaAsset } from "@/lib/types";
import { compactNumber } from "@/lib/utils";

function highlight(text: string) {
  return text.split(/(\s+)/).map((token, i) => {
    if (/^[#@]\w+/.test(token)) {
      return (
        <span key={i} className="text-[var(--aurora-violet)]">
          {token}
        </span>
      );
    }
    if (/^https?:\/\//.test(token)) {
      return (
        <span key={i} className="text-[var(--aurora-teal)] underline">
          {token}
        </span>
      );
    }
    return <span key={i}>{token}</span>;
  });
}

export function NetworkPreview({
  network,
  body,
  media,
  account,
}: {
  network: NetworkId;
  body: string;
  media: MediaAsset[];
  account?: AccountRecord;
}) {
  const meta = NETWORKS[network];
  const trimmed =
    body.length > meta.charLimit ? `${body.slice(0, meta.charLimit - 1)}…` : body || "Your message will appear here.";

  return (
    <article className="panel overflow-hidden">
      <div className="flex items-center gap-2.5 p-4 pb-3">
        <div
          className="grid h-9 w-9 place-items-center rounded-full text-xs font-semibold text-[#07080d]"
          style={{ background: meta.accent }}
        >
          {(account?.displayName ?? "You").slice(0, 1)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--foreground)]">
            {account?.displayName ?? "Your channel"}
          </p>
          <p className="text-xs text-[var(--faint-foreground)]">
            {meta.handlePrefix}
            {account?.handle ?? "you"} &middot; {meta.name}
          </p>
        </div>
      </div>

      <p className="whitespace-pre-wrap px-4 text-sm leading-relaxed text-[var(--foreground)]/90">
        {highlight(trimmed)}
      </p>

      {media.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-0.5 px-4">
          {media.slice(0, 4).map((m) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={m.id}
              src={m.url}
              alt=""
              className="aspect-video w-full rounded-[var(--radius-xs)] object-cover"
            />
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex items-center gap-6 border-t border-[var(--border)] px-4 py-2.5 text-[var(--faint-foreground)]">
        <span className="flex items-center gap-1.5 text-xs">
          <Heart size={13} /> {compactNumber((account?.followers ?? 800) * 0.012)}
        </span>
        <span className="flex items-center gap-1.5 text-xs">
          <MessageCircle size={13} /> {compactNumber((account?.followers ?? 800) * 0.002)}
        </span>
        <span className="flex items-center gap-1.5 text-xs">
          <Repeat2 size={13} /> {compactNumber((account?.followers ?? 800) * 0.003)}
        </span>
        <Share size={13} className="ml-auto" />
      </div>
    </article>
  );
}
