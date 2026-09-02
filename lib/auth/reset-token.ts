import crypto from "node:crypto";

export function generateResetToken() {
  const token = crypto.randomBytes(32).toString("base64url");
  return { token, hash: hashResetToken(token) };
}

export function hashResetToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
