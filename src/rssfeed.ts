import { XMLParser } from "fast-xml-parser";
import { User } from "./db/queries/users.js";
import { Feed } from "./db/queries/feeds.js";

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
