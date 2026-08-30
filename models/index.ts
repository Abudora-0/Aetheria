import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

/* -------------------------------------------------------------------------- */
/*  User                                                                       */
/* -------------------------------------------------------------------------- */

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    timezone: { type: String, default: "America/New_York" },
    plan: { type: String, enum: ["free", "creator", "studio"], default: "free" },
  },
  { timestamps: true },
);

/* -------------------------------------------------------------------------- */
/*  Social account                                                             */
/* -------------------------------------------------------------------------- */

const accountSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    network: { type: String, enum: ["twitter", "linkedin", "instagram", "facebook"], required: true },
    handle: String,
    displayName: String,
    avatarColor: String,
    followers: { type: Number, default: 0 },
    accessTokenCipher: String,
    refreshTokenCipher: String,
    tokenExpiresAt: Date,
    lastRefreshedAt: Date,
    status: { type: String, enum: ["healthy", "expiring", "revoked"], default: "healthy" },
  },
  { timestamps: true },
);
accountSchema.index({ userId: 1, network: 1 }, { unique: true });

/* -------------------------------------------------------------------------- */
/*  Post + embedded scheduling job                                             */
/* -------------------------------------------------------------------------- */

const publishResultSchema = new Schema(
  {
    network: String,
    ok: Boolean,
    remoteId: String,
    permalink: String,
    message: String,
    at: Date,
  },
  { _id: false },
);

const postSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "Untitled signal" },
    base: { type: String, default: "" },
    variants: [{ network: String, body: String, _id: false }],
    networks: [{ type: String }],
    media: [
      {
        id: String,
        url: String,
        width: Number,
        height: Number,
        kind: String,
        bytes: Number,
        provider: String,
        _id: false,
      },
    ],
    status: {
      type: String,
      enum: ["draft", "scheduled", "publishing", "published", "failed", "cancelled"],
      default: "draft",
      index: true,
    },
    scheduledFor: { type: Date, index: true },
    publishedAt: Date,
    results: [publishResultSchema],

    // Scheduling worker fields (atomic claim + retry with backoff)
    attempts: { type: Number, default: 0 },
    nextAttemptAt: { type: Date, index: true },
    lockedAt: { type: Date, default: null },
    lockedBy: { type: String, default: null },
    failureReason: { type: String, default: null },
  },
  { timestamps: true },
);
postSchema.index({ status: 1, scheduledFor: 1, lockedAt: 1 });

/* -------------------------------------------------------------------------- */
/*  Metric snapshot                                                            */
/* -------------------------------------------------------------------------- */

const metricSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    network: { type: String, required: true },
    ts: { type: Date, required: true, index: true },
    impressions: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
  },
  { timestamps: false },
);
metricSchema.index({ userId: 1, ts: 1 });

/* -------------------------------------------------------------------------- */
/*  Subscription                                                               */
/* -------------------------------------------------------------------------- */

const subscriptionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    plan: { type: String, enum: ["free", "creator", "studio"], default: "free" },
    status: {
      type: String,
      enum: ["active", "trialing", "past_due", "canceled"],
      default: "active",
    },
    stripeCustomerId: { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: { type: Boolean, default: false },
    source: { type: String, enum: ["stripe", "simulated"], default: "simulated" },
  },
  { timestamps: true },
);

/* -------------------------------------------------------------------------- */

export type UserDoc = InferSchemaType<typeof userSchema>;
export type AccountDoc = InferSchemaType<typeof accountSchema>;
export type PostDoc = InferSchemaType<typeof postSchema>;
export type MetricDoc = InferSchemaType<typeof metricSchema>;
export type SubscriptionDoc = InferSchemaType<typeof subscriptionSchema>;

export const User = models.User ?? model("User", userSchema);
export const Account = models.Account ?? model("Account", accountSchema);
export const Post = models.Post ?? model("Post", postSchema);
export const Metric = models.Metric ?? model("Metric", metricSchema);
export const Subscription = models.Subscription ?? model("Subscription", subscriptionSchema);

export { mongoose };
