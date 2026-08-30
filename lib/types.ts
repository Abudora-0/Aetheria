import type { NetworkId, PlanId, PostStatus } from "@/lib/constants";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  timezone: string;
  plan: PlanId;
}

export interface AccountRecord {
  id: string;
  userId: string;
  network: NetworkId;
  handle: string;
  displayName: string;
  avatarColor: string;
  followers: number;
  connectedAt: string;
  tokenExpiresAt: string;
  lastRefreshedAt: string | null;
  status: "healthy" | "expiring" | "revoked";
}

export interface PostVariant {
  network: NetworkId;
  body: string;
}

export interface MediaAsset {
  id: string;
  url: string;
  width: number;
  height: number;
  kind: "image" | "video";
  bytes: number;
  provider: "cloudinary" | "mock";
}

export interface PostRecord {
  id: string;
  userId: string;
  title: string;
  base: string;
  variants: PostVariant[];
  networks: NetworkId[];
  media: MediaAsset[];
  status: PostStatus;
  scheduledFor: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  results: PublishResult[];
  attempts: number;
  nextAttemptAt: string | null;
  lockedAt: string | null;
  failureReason: string | null;
}

export interface PublishResult {
  network: NetworkId;
  ok: boolean;
  remoteId: string | null;
  permalink: string | null;
  message: string;
  at: string;
}

export interface MetricPoint {
  postId: string;
  network: NetworkId;
  ts: string;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
}

export interface SubscriptionRecord {
  userId: string;
  plan: PlanId;
  status: "active" | "trialing" | "past_due" | "canceled";
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  source: "stripe" | "simulated";
}

export interface GrowthSeriesPoint {
  date: string;
  impressions: number;
  movingAverage: number;
  growthRate: number;
}

export interface EngagementSummary {
  network: NetworkId | "all";
  impressions: number;
  engagements: number;
  engagementRate: number;
}

export interface TimingCell {
  day: number; // 0 Sunday
  hour: number; // 0-23
  score: number; // average engagement rate
  samples: number;
}

export interface GoldenWindow {
  day: number;
  hour: number;
  score: number;
  label: string;
}

export interface AnalyticsBundle {
  range: { from: string; to: string; days: number };
  totals: {
    impressions: number;
    engagements: number;
    engagementRate: number;
    growthRate: number;
    cadenceScore: number;
    publishedCount: number;
  };
  growth: GrowthSeriesPoint[];
  engagementByNetwork: EngagementSummary[];
  funnel: { stage: string; value: number }[];
  timing: TimingCell[];
  goldenWindows: GoldenWindow[];
  velocity: number[];
}
