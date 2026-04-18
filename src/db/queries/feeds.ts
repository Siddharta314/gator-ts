import { db } from "../index.js";
import { feeds, users } from "../schema.js";
import { eq } from "drizzle-orm";

export async function createFeed(name: string, url: string, userId: string) {
  const [result] = await db
    .insert(feeds)
    .values({ name: name, url: url, userId: userId })
    .returning();
  return result;
}

export async function getFeeds() {
  const result = await db.select().from(feeds);
  return result;
}

export async function getFeedsWithUserName() {
  const result = await db
    .select()
    .from(feeds)
    .innerJoin(users, eq(feeds.userId, users.id));
  return result;
}

export type Feed = typeof feeds.$inferSelect;
