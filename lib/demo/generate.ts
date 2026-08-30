import { NETWORK_LIST, type NetworkId } from "@/lib/constants";
import { seededRandom } from "@/lib/utils";
import type {
  AccountRecord,
  MetricPoint,
  PostRecord,
  SubscriptionRecord,
} from "@/lib/types";

export const DEMO_USER = {
  id: "usr_aetheria_demo",
  name: "Nova Kessler",
  email: "demo@aetheria.app",
  timezone: "America/New_York",
  plan: "creator" as const,
  password: "aurora", // demo credentials, shown on the sign in screen
};

const CAPTIONS = [
  "The quiet part of building in public: most days look like nothing is happening.",
  "Shipped a tiny feature today. Tiny features compound.",
  "A thread on how we cut our render time by 60 percent without a rewrite.",
  "Your first 100 followers care about you. Your next 10k care about the work.",
  "Behind the scenes of this week's release. Swipe for the messy middle.",
  "Three tools that replaced an entire folder of spreadsheets.",
  "We almost cut this feature. Users told us it was the reason they stayed.",
  "Consistency beats intensity. Posting once a week for a year changed everything.",
  "New case study is live. Real numbers, real mistakes, real recovery.",
  "The best growth channel is a product people want to talk about.",
  "Reminder: the algorithm rewards the thing you were going to do anyway.",
  "Sketching the next chapter of the roadmap. Feedback welcome.",
  "How we run launch week with a team of four.",
  "A short film about a long build.",
  "Metrics are a map, not the territory. Talk to five customers this week.",
  "The redesign is done. Here is every screen, before and after.",
  "One year of daily notes, distilled into six lessons.",
  "We open sourced the thing everyone kept asking for.",
  "Office hours this Friday. Bring your hardest scaling question.",
  "The feature nobody requested is now the one nobody can live without.",
];

const TITLES = [
  "Build in public update",
  "Launch week teaser",
  "Engineering deep dive",
  "Growth reflection",
  "Behind the scenes",
  "Tooling roundup",
  "Roadmap sketch",
  "Case study drop",
  "Community office hours",
  "Redesign reveal",
];

function pick<T>(arr: T[], rand: () => number) {
  return arr[Math.floor(rand() * arr.length)];
}

/** Diurnal weight: engagement peaks mid morning and early evening on weekdays. */
function timingWeight(day: number, hour: number) {
  const weekend = day === 0 || day === 6;
  const morning = Math.exp(-Math.pow(hour - 9.5, 2) / 6);
  const evening = Math.exp(-Math.pow(hour - 18.5, 2) / 8);
  const base = 0.35 + morning * 0.8 + evening * 0.65;
  return weekend ? base * 0.72 : base;
}

export interface DemoDataset {
  user: typeof DEMO_USER;
  accounts: AccountRecord[];
  posts: PostRecord[];
  metrics: MetricPoint[];
  subscription: SubscriptionRecord;
}

export function generateDemoDataset(seed = 20260830): DemoDataset {
  const rand = seededRandom(seed);
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const connectedNetworks: NetworkId[] = ["twitter", "linkedin", "instagram", "facebook"];
  const accounts: AccountRecord[] = connectedNetworks.map((network, i) => {
    const meta = NETWORK_LIST.find((n) => n.id === network)!;
    const expiresIn = [42, 6, 210, 88][i] * day;
    return {
      id: `acc_${network}`,
      userId: DEMO_USER.id,
      network,
      handle: network === "linkedin" ? "nova-kessler" : "novakessler",
      displayName: "Nova Kessler",
      avatarColor: meta.accent,
      followers: Math.round(4200 + rand() * 38000),
      connectedAt: new Date(now - (120 + i * 10) * day).toISOString(),
      tokenExpiresAt: new Date(now + expiresIn).toISOString(),
      lastRefreshedAt: new Date(now - (2 + i) * day).toISOString(),
      status: expiresIn < 10 * day ? "expiring" : "healthy",
    };
  });

  const posts: PostRecord[] = [];
  const metrics: MetricPoint[] = [];

  // 90 days of history, roughly 5 posts per week.
  for (let d = 90; d >= -10; d--) {
    const postsToday = rand() < 0.7 ? (rand() < 0.3 ? 2 : 1) : 0;
    for (let k = 0; k < postsToday; k++) {
      const hour = 7 + Math.floor(rand() * 13);
      const minute = Math.floor(rand() * 60);
      const created = now - d * day;
      const scheduledFor = new Date(created).setHours(hour, minute, 0, 0);
      const isFuture = scheduledFor > now;
      const networks = connectedNetworks.filter(() => rand() < 0.62);
      if (networks.length === 0) networks.push("twitter");
      const base = pick(CAPTIONS, rand);
      const id = `post_${d + 100}_${k}`;
      const status = isFuture ? (rand() < 0.15 ? "draft" : "scheduled") : "published";

      posts.push({
        id,
        userId: DEMO_USER.id,
        title: pick(TITLES, rand),
        base,
        variants: networks.map((network) => ({ network, body: base })),
        networks,
        media:
          rand() < 0.4
            ? [
                {
                  id: `md_${id}`,
                  url: `https://picsum.photos/seed/${id}/1200/800`,
                  width: 1200,
                  height: 800,
                  kind: "image",
                  bytes: 240000,
                  provider: "mock",
                },
              ]
            : [],
        status,
        scheduledFor: new Date(scheduledFor).toISOString(),
        publishedAt: status === "published" ? new Date(scheduledFor).toISOString() : null,
        createdAt: new Date(created - day).toISOString(),
        updatedAt: new Date(created).toISOString(),
        attempts: status === "published" ? 1 : 0,
        nextAttemptAt: null,
        lockedAt: null,
        failureReason: null,
        results:
          status === "published"
            ? networks.map((network) => ({
                network,
                ok: true,
                remoteId: `${network}_${Math.floor(rand() * 1e9)}`,
                permalink: `https://${network}.example/${id}`,
                message: "Published",
                at: new Date(scheduledFor).toISOString(),
              }))
            : [],
      });

      if (status !== "published") continue;

      // Metric snapshots at +1h, +6h, +24h, +72h after publishing.
      const dayOfWeek = new Date(scheduledFor).getDay();
      const weight = timingWeight(dayOfWeek, hour);
      for (const network of networks) {
        const reach = Math.round((900 + rand() * 5200) * weight);
        const offsets = [1, 6, 24, 72];
        let cumulative = 0;
        for (const off of offsets) {
          const snapTs = scheduledFor + off * 60 * 60 * 1000;
          if (snapTs > now) break;
          const fraction = off === 1 ? 0.3 : off === 6 ? 0.62 : off === 24 ? 0.88 : 1;
          const impressions = Math.round(reach * fraction);
          const engRate = (0.018 + rand() * 0.05) * (0.7 + weight * 0.4);
          const engagements = Math.round(impressions * engRate);
          cumulative = impressions;
          metrics.push({
            postId: id,
            network,
            ts: new Date(snapTs).toISOString(),
            impressions,
            likes: Math.round(engagements * 0.68),
            comments: Math.round(engagements * 0.12),
            shares: Math.round(engagements * 0.1),
            clicks: Math.round(engagements * 0.1),
          });
        }
        void cumulative;
      }
    }
  }

  const subscription: SubscriptionRecord = {
    userId: DEMO_USER.id,
    plan: "creator",
    status: "active",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    currentPeriodEnd: new Date(now + 21 * day).toISOString(),
    cancelAtPeriodEnd: false,
    source: "simulated",
  };

  posts.sort((a, b) => (a.scheduledFor! < b.scheduledFor! ? 1 : -1));

  return { user: DEMO_USER, accounts, posts, metrics, subscription };
}
