import crypto from "node:crypto";
import { env } from "@/lib/env";

/**
 * AES-256-GCM helpers for social OAuth tokens at rest. When TOKEN_ENC_KEY is
 * absent (demo mode) we fall back to a reversible base64 marker so nothing
 * breaks, and log a single warning so it is obvious this is not production safe.
 */

let warned = false;

function key(): Buffer | null {
  const raw = env.tokenEncryptionKey;
  if (!raw) {
    if (!warned) {
      warned = true;
      console.warn("[aetheria] TOKEN_ENC_KEY not set, storing tokens in plain text (demo mode)");
    }
    return null;
  }
  // Accept hex (64 chars) or base64 or a passphrase (hashed to 32 bytes).
  if (/^[0-9a-f]{64}$/i.test(raw)) return Buffer.from(raw, "hex");
  const buf = Buffer.from(raw, "base64");
  if (buf.length === 32) return buf;
  return crypto.createHash("sha256").update(raw).digest();
}

export function encryptToken(plain: string): string {
  const k = key();
  if (!k) return `plain:${Buffer.from(plain).toString("base64")}`;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", k, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

export function decryptToken(payload: string): string {
  if (payload.startsWith("plain:")) {
    return Buffer.from(payload.slice(6), "base64").toString("utf8");
  }
  const k = key();
  if (!k) throw new Error("Cannot decrypt token without TOKEN_ENC_KEY");
  const [, ivB64, tagB64, dataB64] = payload.split(":");
  const decipher = crypto.createDecipheriv("aes-256-gcm", k, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
