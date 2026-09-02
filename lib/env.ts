/**
 * Central environment access. Every integration is optional: when a key is
 * missing the matching subsystem falls back to a deterministic mock so the app
 * boots and renders with zero configuration. Drop real values in to go live.
 */

function read(key: string): string | undefined {
  const value = process.env[key];
  if (value === undefined || value === "") return undefined;
  return value;
}

const vercelUrl = read("VERCEL_URL") ? `https://${read("VERCEL_URL")}` : undefined;

export const env = {
  appUrl: read("NEXT_PUBLIC_APP_URL") ?? vercelUrl ?? "http://localhost:3000",
  nodeEnv: process.env.NODE_ENV ?? "development",

  // Data source. "auto" uses live when MONGODB_URI is present, demo otherwise.
  dataMode: (read("DATA_MODE") ?? "auto") as "auto" | "live" | "demo",
  mongoUri: read("MONGODB_URI"),

  // Auth
  jwtSecret: read("JWT_SECRET") ?? "aetheria-development-secret-change-me",
  tokenEncryptionKey: read("TOKEN_ENC_KEY"),

  // Scheduling worker
  cronSecret: read("CRON_SECRET"),

  // Transactional email
  email: {
    apiKey: read("RESEND_API_KEY"),
    from: read("EMAIL_FROM"),
  },

  // Media
  cloudinary: {
    cloudName: read("CLOUDINARY_CLOUD_NAME"),
    apiKey: read("CLOUDINARY_API_KEY"),
    apiSecret: read("CLOUDINARY_API_SECRET"),
  },

  // Billing
  stripe: {
    secretKey: read("STRIPE_SECRET_KEY"),
    webhookSecret: read("STRIPE_WEBHOOK_SECRET"),
    priceCreator: read("STRIPE_PRICE_CREATOR"),
    priceStudio: read("STRIPE_PRICE_STUDIO"),
    portalReturnUrl: read("STRIPE_PORTAL_RETURN_URL"),
  },

  // Social OAuth apps (one pair per network)
  social: {
    twitter: { id: read("TWITTER_CLIENT_ID"), secret: read("TWITTER_CLIENT_SECRET") },
    linkedin: { id: read("LINKEDIN_CLIENT_ID"), secret: read("LINKEDIN_CLIENT_SECRET") },
    instagram: { id: read("INSTAGRAM_CLIENT_ID"), secret: read("INSTAGRAM_CLIENT_SECRET") },
    facebook: { id: read("FACEBOOK_CLIENT_ID"), secret: read("FACEBOOK_CLIENT_SECRET") },
  },
};

export function resolveDataMode(): "live" | "demo" {
  if (env.dataMode === "live") return "live";
  if (env.dataMode === "demo") return "demo";
  return env.mongoUri ? "live" : "demo";
}

export const isLive = () => resolveDataMode() === "live";
export const isDemo = () => resolveDataMode() === "demo";

export const integrations = {
  get stripe() {
    return Boolean(env.stripe.secretKey);
  },
  get cloudinary() {
    return Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);
  },
  get email() {
    return Boolean(env.email.apiKey && env.email.from);
  },
  social(network: keyof typeof env.social) {
    const app = env.social[network];
    return Boolean(app.id && app.secret);
  },
};
