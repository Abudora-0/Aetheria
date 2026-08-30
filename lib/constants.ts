import type { LucideIcon } from "lucide-react";
import { Linkedin, Instagram, Facebook, Twitter } from "lucide-react";

export type NetworkId = "twitter" | "linkedin" | "instagram" | "facebook";

export interface NetworkMeta {
  id: NetworkId;
  name: string;
  handlePrefix: string;
  charLimit: number;
  accent: string;
  icon: LucideIcon;
}

export const NETWORKS: Record<NetworkId, NetworkMeta> = {
  twitter: {
    id: "twitter",
    name: "X",
    handlePrefix: "@",
    charLimit: 280,
    accent: "#4FD1C5",
    icon: Twitter,
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    handlePrefix: "in/",
    charLimit: 3000,
    accent: "#8B5CF6",
    icon: Linkedin,
  },
  instagram: {
    id: "instagram",
    name: "Instagram",
    handlePrefix: "@",
    charLimit: 2200,
    accent: "#F472B6",
    icon: Instagram,
  },
  facebook: {
    id: "facebook",
    name: "Facebook",
    handlePrefix: "/",
    charLimit: 63206,
    accent: "#F5C451",
    icon: Facebook,
  },
};

export const NETWORK_LIST = Object.values(NETWORKS);

export type PlanId = "free" | "creator" | "studio";

export interface PlanMeta {
  id: PlanId;
  name: string;
  price: number;
  cadence: string;
  tagline: string;
  limits: { channels: number; scheduledPerMonth: number; analyticsHistoryDays: number };
  features: string[];
}

export const PLANS: Record<PlanId, PlanMeta> = {
  free: {
    id: "free",
    name: "Drift",
    price: 0,
    cadence: "forever",
    tagline: "Find your rhythm.",
    limits: { channels: 2, scheduledPerMonth: 30, analyticsHistoryDays: 14 },
    features: ["2 connected channels", "30 scheduled signals / month", "14 day analytics window", "The Dial calendar"],
  },
  creator: {
    id: "creator",
    name: "Creator",
    price: 18,
    cadence: "per month",
    tagline: "Publish everywhere, on time.",
    limits: { channels: 6, scheduledPerMonth: 400, analyticsHistoryDays: 120 },
    features: [
      "6 connected channels",
      "400 scheduled signals / month",
      "120 day analytics window",
      "Optimal Time Halo",
      "Auto token refresh",
    ],
  },
  studio: {
    id: "studio",
    name: "Studio",
    price: 49,
    cadence: "per month",
    tagline: "Run the whole constellation.",
    limits: { channels: 24, scheduledPerMonth: 5000, analyticsHistoryDays: 400 },
    features: [
      "24 connected channels",
      "Unlimited scheduling",
      "400 day analytics window",
      "Cadence score and growth velocity",
      "Priority publish queue",
      "CSV export",
    ],
  },
};

export const PLAN_LIST = Object.values(PLANS);

export type PostStatus =
  | "draft"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed"
  | "cancelled";

export const STATUS_META: Record<PostStatus, { label: string; tone: string }> = {
  draft: { label: "Draft", tone: "var(--muted-foreground)" },
  scheduled: { label: "Scheduled", tone: "var(--aurora-teal)" },
  publishing: { label: "Publishing", tone: "var(--aurora-gold)" },
  published: { label: "Published", tone: "var(--aurora-violet)" },
  failed: { label: "Failed", tone: "var(--danger)" },
  cancelled: { label: "Cancelled", tone: "var(--muted-foreground)" },
};

export const APP_NAME = "Aetheria";
export const APP_TAGLINE = "Automated social media scheduling and analytics for creators who move fast.";
