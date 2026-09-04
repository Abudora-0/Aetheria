import { cache } from "react";
import { getData } from "@/lib/data";

/**
 * The studio layout and most studio pages each need the user's accounts,
 * posts or subscription independently. Wrapping the reads in React's cache()
 * means the layout and a page that both ask for the same user's accounts
 * share one Mongo round trip per request instead of two.
 */

export const getAccountsForUser = cache(async (userId: string) => {
  const data = await getData();
  return data.accounts.listByUser(userId);
});

export const getPostsForUser = cache(async (userId: string) => {
  const data = await getData();
  return data.posts.listByUser(userId);
});

export const getSubscriptionForUser = cache(async (userId: string) => {
  const data = await getData();
  return data.subscription.forUser(userId);
});
