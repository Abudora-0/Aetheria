import { NETWORK_LIST, type NetworkId } from "@/lib/constants";
import { integrations } from "@/lib/env";
import { createMockAdapter } from "@/lib/social/mock-adapter";
import { createRealAdapter } from "@/lib/social/real-adapters";
import type { SocialAdapter } from "@/lib/social/types";

const cache = new Map<NetworkId, SocialAdapter>();

export function getAdapter(network: NetworkId): SocialAdapter {
  const hit = cache.get(network);
  if (hit) return hit;
  const adapter = integrations.social(network)
    ? createRealAdapter(network)
    : createMockAdapter(network);
  cache.set(network, adapter);
  return adapter;
}

export function adapterStatus() {
  return NETWORK_LIST.map((n) => ({
    network: n.id,
    name: n.name,
    live: integrations.social(n.id),
  }));
}

export type { SocialAdapter } from "@/lib/social/types";
