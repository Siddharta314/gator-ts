import { XMLParser } from "fast-xml-parser";
import { User } from "./db/queries/users.js";
import {
  Feed,
  getNextFeedToFetch,
  markFeedFetched,
} from "./db/queries/feeds.js";
import { createPost } from "./db/queries/posts.js";

type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

export async function fetchFeed(feedURL: string) {
  const response = await fetch(feedURL, {
    headers: {
      "User-Agent": "gator",
    },
  });
  const xml = await response.text();
  const parser = new XMLParser();
  const { rss } = parser.parse(xml);

  if (!rss.channel) {
    throw new Error("Invalid RSS feed");
  }

  const items: RSSItem[] = [];
  if (Array.isArray(rss.channel.item)) {
    for (const item of rss.channel.item) {
      if (!item.description || !item.title || !item.link || !item.pubDate) {
        continue;
      }
      items.push({
        title: item.title,
        link: item.link,
        description: item.description,
        pubDate: item.pubDate,
      });
    }
  } else if (typeof rss.channel.item === "object") {
    const item = rss.channel.item;
    if (item.description && item.title && item.link && item.pubDate) {
      items.push({
        title: item.title,
        link: item.link,
        description: item.description,
        pubDate: item.pubDate,
      });
    }
  }

  const rssFeed: RSSFeed = {
    channel: {
      title: rss.channel.title,
      link: rss.channel.link,
      description: rss.channel.description,
      item: items,
    },
  };
  return rssFeed;
}

export function printFeed(feed: Feed, user: User) {
  console.log(`* User:    ${user.name}`);
  console.log(`* Name:    ${feed.name}   URL:     ${feed.url}`);
  console.log(`* CreatedAt: ${feed.createdAt}`);
}

export async function scrapeFeeds() {
  const feed = await getNextFeedToFetch();
  if (!feed) {
    console.log("No feeds to scrape");
    return;
  }
  console.log(`Scraping feed: ${feed.url}`);
  try {
    await markFeedFetched(feed.id);
    const rssData = await fetchFeed(feed.url);
    // console.log("--- RSS DATA STRUCTURE ---");
    // console.log(JSON.stringify(rssData, null, 2));
    const items = rssData?.channel?.item || [];
    const itemsArray = Array.isArray(items) ? items : [items];
    for (const item of itemsArray) {
      console.log(item.title);
      let publishedAt: Date | null = null;
      if (item.pubDate) {
        const date = new Date(item.pubDate);
        if (!isNaN(date.getTime())) {
          publishedAt = date;
        }
      }

      await createPost({
        title: item.title || "Untitled Post",
        url: item.link || "",
        description: item.description || null,
        publishedAt: publishedAt,
        feedId: feed.id,
      });
    }
    console.log(
      `✅ Successfully scraped ${itemsArray.length} posts from ${feed.name}`,
    );
  } catch (error) {
    console.error(`❌ Error scraping feed "${feed.name}":`, error);
  }
}
