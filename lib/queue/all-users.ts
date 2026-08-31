import { resolveDataMode } from "@/lib/env";
import { DEMO_USER } from "@/lib/demo/generate";

/** Every user id in the current data source, for the maintenance workers. */
export async function allUserIds(): Promise<string[]> {
  if (resolveDataMode() === "demo") return [DEMO_USER.id];
  const { connectToDatabase } = await import("@/lib/db");
  const { User } = await import("@/models");
  await connectToDatabase();
  const users = await User.find().select("_id").lean();
  return users.map((u) => String(u._id));
}
