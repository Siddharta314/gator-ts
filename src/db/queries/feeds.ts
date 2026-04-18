import { db } from "../index.js";
import { feeds, users, feed_follows } from "../schema.js";
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

export async function createFeedFollow(userId: string, feedId: string) {
  const [newFeedFollow] = await db
    .insert(feed_follows)
    .values({ userId, feedId })
    .returning();

  const [result] = await db
    .select({
      id: feed_follows.id,
      createdAt: feed_follows.createdAt,
      updatedAt: feed_follows.updatedAt,
      feedName: feeds.name,
      userName: users.name,
    })
    .from(feed_follows)
    .innerJoin(feeds, eq(feed_follows.feedId, feeds.id))
    .innerJoin(users, eq(feed_follows.userId, users.id))
    .where(eq(feed_follows.id, newFeedFollow.id));

  return result;
}
