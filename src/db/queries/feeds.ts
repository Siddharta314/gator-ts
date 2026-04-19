import { db } from "../index.js";
import { feeds, users, feed_follows } from "../schema.js";
import { and, eq, sql } from "drizzle-orm";

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

export async function getFeedByUrl(url: string) {
  const [result] = await db.select().from(feeds).where(eq(feeds.url, url));
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

export async function getFeedFollowsForUser(username: string) {
  // const results = await db
  //   .select()
  //   .from(feed_follows)
  //   .innerJoin(feeds, eq(feed_follows.feedId, feeds.id))
  //   .innerJoin(users, eq(feed_follows.userId, users.id))
  //   .where(eq(users.name, username));
  // return results;
  return await db
    .select({
      id: feed_follows.id,
      feedName: feeds.name,
      userName: users.name,
    })
    .from(feed_follows)
    .innerJoin(feeds, eq(feed_follows.feedId, feeds.id))
    .innerJoin(users, eq(feed_follows.userId, users.id))
    .where(eq(users.name, username));
}

// export async function deleteFeedFollow(userId: string, feedId: string) {
//   const result = await db
//     .delete(feed_follows)
//     .where(
//       and(eq(feed_follows.userId, userId), eq(feed_follows.feedId, feedId)),
//     )
//     .returning();

//   return result[0];
// }

export async function deleteFeedFollow(userId: string, feedUrl: string) {
  const feed = await db.query.feeds.findFirst({
    where: eq(feeds.url, feedUrl),
  });

  if (!feed) {
    return null;
  }

  const result = await db
    .delete(feed_follows)
    .where(
      and(eq(feed_follows.userId, userId), eq(feed_follows.feedId, feed.id)),
    )
    .returning();

  return result[0];
}

export async function markFeedFetched(feedId: string) {
  const [result] = await db
    .update(feeds)
    .set({
      lastFetchedAt: new Date(),
      updatedAt: new Date(), // Opcional si tienes $onUpdate en el schema
    })
    .where(eq(feeds.id, feedId))
    .returning();

  return result;
}

export async function getNextFeedToFetch() {
  const [result] = await db
    .select()
    .from(feeds)
    .orderBy(sql`${feeds.lastFetchedAt} ASC NULLS FIRST`)
    .limit(1);

  return result;
}
