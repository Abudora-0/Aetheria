import { z } from "zod";
import { requireApiUser } from "@/lib/api-auth";
import { getData } from "@/lib/data";
import { PLANS } from "@/lib/constants";
import { fail, handleError, ok } from "@/lib/http";

export const runtime = "nodejs";

const schema = z.object({
  network: z.enum(["twitter", "linkedin", "instagram", "facebook"]),
});

export async function GET() {
  try {
    const user = await requireApiUser();
    const data = await getData();
    return ok({ accounts: await data.accounts.listByUser(user.id) });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const { network } = schema.parse(await request.json());
    const data = await getData();

    const sub = await data.subscription.forUser(user.id);
    const existing = await data.accounts.listByUser(user.id);
    if (existing.length >= PLANS[sub.plan].limits.channels) {
      return fail(`Your ${PLANS[sub.plan].name} plan connects up to ${PLANS[sub.plan].limits.channels} channels`, 402);
    }

    const account = await data.accounts.connect(user.id, network);
    return ok({ account });
  } catch (err) {
    return handleError(err);
  }
}
