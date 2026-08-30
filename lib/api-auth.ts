import { getCurrentUser } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/types";

export async function requireApiUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    const err = new Error("UNAUTHORIZED");
    throw err;
  }
  return user;
}
