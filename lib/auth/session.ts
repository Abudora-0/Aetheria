import { cache } from "react";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";
import { getData } from "@/lib/data";
import type { SessionUser } from "@/lib/types";

const COOKIE = "aetheria_session";
const secret = new TextEncoder().encode(env.jwtSecret);
const MAX_AGE = 60 * 60 * 24 * 30;

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return (payload.sub as string) ?? null;
  } catch {
    return null;
  }
}

/**
 * Every studio layout and page independently calls getCurrentUser(), which
 * would otherwise mean one repeated Mongo round trip per navigation for the
 * same request. React's cache() memoizes it per render pass, so only the
 * first call in a given request actually hits the database.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const id = await getSessionUserId();
  if (!id) return null;
  const data = await getData();
  return data.users.findById(id);
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export const SESSION_COOKIE = COOKIE;
