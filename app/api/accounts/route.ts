import { requireApiUser } from "@/lib/api-auth";
import { getData } from "@/lib/data";
import { handleError, ok } from "@/lib/http";

export const runtime = "nodejs";

/**
 * Connecting a channel goes through the OAuth flow at
 * /api/oauth/[network]/authorize (which falls back to a sandbox channel when no
 * OAuth app is configured). This endpoint just lists the connected channels.
 */
export async function GET() {
  try {
    const user = await requireApiUser();
    const data = await getData();
    return ok({ accounts: await data.accounts.listByUser(user.id) });
  } catch (err) {
    return handleError(err);
  }
}
