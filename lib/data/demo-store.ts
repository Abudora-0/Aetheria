import bcrypt from "bcryptjs";
import { generateDemoDataset, DEMO_USER } from "@/lib/demo/generate";
import type {
  AccountRecord,
  MetricPoint,
  PostRecord,
  SessionUser,
  SubscriptionRecord,
} from "@/lib/types";

export interface DemoStore {
  users: (SessionUser & { passwordHash: string })[];
  accounts: AccountRecord[];
  posts: PostRecord[];
  metrics: MetricPoint[];
  subscriptions: SubscriptionRecord[];
}

const globalForStore = globalThis as unknown as { _aetheriaDemoStore?: DemoStore };

/**
 * In-memory dataset for demo mode. Seeded once per server process from a
 * deterministic generator, then mutated in place. Cold starts reset it, which
 * is acceptable for a public sandbox; connect MongoDB to persist.
 */
export function demoStore(): DemoStore {
  if (globalForStore._aetheriaDemoStore) return globalForStore._aetheriaDemoStore;

  const data = generateDemoDataset();
  const store: DemoStore = {
    users: [
      {
        id: DEMO_USER.id,
        name: DEMO_USER.name,
        email: DEMO_USER.email,
        timezone: DEMO_USER.timezone,
        plan: DEMO_USER.plan,
        passwordHash: bcrypt.hashSync(DEMO_USER.password, 10),
      },
    ],
    accounts: data.accounts,
    posts: data.posts,
    metrics: data.metrics,
    subscriptions: [data.subscription],
  };

  globalForStore._aetheriaDemoStore = store;
  return store;
}

/** Test helper: force a fresh dataset. */
export function resetDemoStore() {
  globalForStore._aetheriaDemoStore = undefined;
}
