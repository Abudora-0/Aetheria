import { NETWORKS, type NetworkId } from "@/lib/constants";
import type { PostRecord } from "@/lib/types";

/** Split a base draft into per network variants, trimming to each char limit. */
export function buildVariants(base: string, networks: NetworkId[], overrides?: Record<string, string>) {
  return networks.map((network) => {
    const custom = overrides?.[network];
    const body = (custom ?? base).trim();
    const limit = NETWORKS[network].charLimit;
    return { network, body: body.length > limit ? `${body.slice(0, limit - 1)}…` : body };
  });
}

export function overLimitNetworks(base: string, networks: NetworkId[], overrides?: Record<string, string>) {
  return networks.filter((n) => (overrides?.[n] ?? base).trim().length > NETWORKS[n].charLimit);
}

export function nextGoldenSlot(base: Date, windows: { day: number; hour: number }[]): Date | null {
  if (!windows.length) return null;
  for (let addDays = 0; addDays < 14; addDays++) {
    const candidateDay = new Date(base);
    candidateDay.setDate(base.getDate() + addDays);
    for (const w of windows) {
      if (candidateDay.getDay() !== w.day) continue;
      const slot = new Date(candidateDay);
      slot.setHours(w.hour, 0, 0, 0);
      if (slot > base) return slot;
    }
  }
  return null;
}

export function summarizePost(post: PostRecord) {
  const okResults = post.results.filter((r) => r.ok).length;
  return {
    id: post.id,
    title: post.title,
    status: post.status,
    networks: post.networks,
    scheduledFor: post.scheduledFor,
    delivered: okResults,
    total: post.networks.length,
  };
}
