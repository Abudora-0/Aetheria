import type { NetworkId } from "@/lib/constants";
import type { AccountRecord, MediaAsset } from "@/lib/types";

/** An account plus its decrypted tokens, as handed to a live adapter. */
export type AdapterAccount = AccountRecord & {
  tokens?: { accessToken: string; refreshToken?: string };
};

export interface PublishPayload {
  body: string;
  media: MediaAsset[];
  account: AdapterAccount;
}

export interface PublishOutcome {
  ok: boolean;
  remoteId: string | null;
  permalink: string | null;
  message: string;
}

export interface RefreshOutcome {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface MetricPull {
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
}

export interface SocialAdapter {
  id: NetworkId;
  live: boolean;
  publish(payload: PublishPayload): Promise<PublishOutcome>;
  refreshToken(account: AdapterAccount): Promise<RefreshOutcome>;
  fetchMetrics(remoteId: string, account: AdapterAccount): Promise<MetricPull>;
}
