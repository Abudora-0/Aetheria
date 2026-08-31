import type {
  AccountRecord,
  MetricPoint,
  PostRecord,
  SessionUser,
  SubscriptionRecord,
} from "@/lib/types";
import type { NetworkId, PlanId, PostStatus } from "@/lib/constants";

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  timezone?: string;
}

export interface PostDraftInput {
  id?: string;
  title: string;
  base: string;
  networks: NetworkId[];
  variants: { network: NetworkId; body: string }[];
  media: PostRecord["media"];
  scheduledFor: string | null;
  status: PostStatus;
}

export interface ConnectTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  handle?: string;
  displayName?: string;
}

/** An account record with its decrypted tokens attached, for the worker only. */
export type HydratedAccount = AccountRecord & {
  tokens?: { accessToken: string; refreshToken?: string };
};

export interface DataPort {
  mode: "live" | "demo";

  users: {
    findByEmail(email: string): Promise<(SessionUser & { passwordHash: string }) | null>;
    findById(id: string): Promise<SessionUser | null>;
    create(input: CreateUserInput & { passwordHash: string }): Promise<SessionUser>;
    setPlan(userId: string, plan: PlanId): Promise<void>;
    updateProfile(userId: string, patch: { name?: string; timezone?: string }): Promise<SessionUser>;
  };

  accounts: {
    listByUser(userId: string): Promise<AccountRecord[]>;
    /** Every account for a user with decrypted tokens, used by the worker. */
    forPublishing(userId: string): Promise<HydratedAccount[]>;
    connect(userId: string, network: NetworkId, tokens?: ConnectTokens): Promise<AccountRecord>;
    disconnect(userId: string, accountId: string): Promise<void>;
    refresh(
      userId: string,
      accountId: string,
      tokens?: { accessToken: string; refreshToken?: string; expiresIn: number },
    ): Promise<AccountRecord>;
    listExpiring(withinHours: number): Promise<HydratedAccount[]>;
  };

  posts: {
    listByUser(userId: string, filter?: { status?: PostStatus[] }): Promise<PostRecord[]>;
    findById(userId: string, id: string): Promise<PostRecord | null>;
    save(userId: string, draft: PostDraftInput): Promise<PostRecord>;
    updateStatus(id: string, status: PostStatus, patch?: Partial<PostRecord>): Promise<void>;
    reschedule(userId: string, id: string, scheduledFor: string): Promise<PostRecord>;
    cancel(userId: string, id: string): Promise<void>;
    /** Atomically claim due jobs for this worker run. */
    claimDue(now: Date, workerId: string, limit: number): Promise<PostRecord[]>;
    recordAttempt(
      id: string,
      outcome: { ok: boolean; results: PostRecord["results"]; failureReason?: string | null; nextAttemptAt?: string | null },
    ): Promise<void>;
  };

  metrics: {
    insertMany(points: MetricPoint[]): Promise<void>;
    forUser(userId: string, fromISO: string): Promise<MetricPoint[]>;
    publishedPostsMissingMetrics(userId: string): Promise<PostRecord[]>;
  };

  subscription: {
    forUser(userId: string): Promise<SubscriptionRecord>;
    upsert(userId: string, patch: Partial<SubscriptionRecord>): Promise<SubscriptionRecord>;
  };
}
