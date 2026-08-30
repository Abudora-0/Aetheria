import { z } from "zod";
import { requireApiUser } from "@/lib/api-auth";
import { getData } from "@/lib/data";
import { PLANS } from "@/lib/constants";
import { buildVariants } from "@/lib/posts/compose";
import { fail, handleError, ok } from "@/lib/http";

export const runtime = "nodejs";

const networkEnum = z.enum(["twitter", "linkedin", "instagram", "facebook"]);

const schema = z.object({
  id: z.string().optional(),
  title: z.string().max(120).optional(),
  base: z.string().min(1).max(64000),
  networks: z.array(networkEnum).min(1),
  overrides: z.record(networkEnum, z.string()).optional(),
  media: z
    .array(
      z.object({
        id: z.string(),
        url: z.string().url(),
        width: z.number(),
        height: z.number(),
        kind: z.enum(["image", "video"]),
        bytes: z.number(),
        provider: z.enum(["cloudinary", "mock"]),
      }),
    )
    .default([]),
  scheduledFor: z.string().datetime().nullable().optional(),
  action: z.enum(["draft", "schedule"]).default("draft"),
});

export async function GET() {
  try {
    const user = await requireApiUser();
    const data = await getData();
    const posts = await data.posts.listByUser(user.id);
    return ok({ posts });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const body = schema.parse(await request.json());
    const data = await getData();

    if (body.action === "schedule" && !body.scheduledFor) {
      return fail("Pick a time before scheduling", 422);
    }
    if (body.scheduledFor && new Date(body.scheduledFor).getTime() < Date.now() - 60_000) {
      return fail("That time is in the past", 422);
    }

    const sub = await data.subscription.forUser(user.id);
    const limit = PLANS[sub.plan].limits.scheduledPerMonth;
    if (body.action === "schedule" && !body.id) {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const scheduledThisMonth = (await data.posts.listByUser(user.id)).filter(
        (p) => p.status !== "draft" && p.createdAt >= since,
      ).length;
      if (scheduledThisMonth >= limit) {
        return fail(`Your ${PLANS[sub.plan].name} plan allows ${limit} scheduled signals per month`, 402);
      }
    }

    const variants = buildVariants(body.base, body.networks, body.overrides);
    const post = await data.posts.save(user.id, {
      id: body.id,
      title: body.title?.trim() || body.base.slice(0, 48),
      base: body.base,
      networks: body.networks,
      variants,
      media: body.media,
      scheduledFor: body.action === "schedule" ? body.scheduledFor ?? null : body.scheduledFor ?? null,
      status: body.action === "schedule" ? "scheduled" : "draft",
    });

    return ok({ post });
  } catch (err) {
    return handleError(err);
  }
}
