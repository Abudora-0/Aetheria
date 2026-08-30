import type { NetworkId } from "@/lib/constants";
import type { AccountRecord, MediaAsset } from "@/lib/types";

export interface PublishPayload {
  body: string;
  media: MediaAsset[];
  account: AccountRecord;
}

export interface PublishOutcome {
  ok: boolean;
  remoteId: string | null;
  permalink: string | null;
  message: string;
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
  refreshToken(account: AccountRecord): Promise<{ expiresAt: string }>;
  fetchMetrics(remoteId: string, account: AccountRecord): Promise<MetricPull>;
}
