import { setUser } from "./config.js";
import {
  createUser,
  getUserByName,
  deleteAllUsers,
  getUsers,
  User,
} from "./db/queries/users.js";
import { config } from "./config.js";
import { fetchFeed, printFeed, scrapeFeeds } from "./rssfeed.js";
import {
  createFeed,
  createFeedFollow,
  deleteFeedFollow,
  getFeedByUrl,
  getFeedFollowsForUser,
  getFeedsWithUserName,
} from "./db/queries/feeds.js";
import { type UserCommandHandler } from "./middleware.js";

export type CommandHandler = (
  cmdName: string,
  ...args: string[]
) => Promise<void>;

export type CommandsRegistry = Record<string, CommandHandler>;

export async function handlerLogin(cmdName: string, ...args: string[]) {
  if (args.length !== 1) {
    throw new Error("Usage: login <username>");
  }
  const newUser = args[0];
  const user = await getUserByName(newUser);
  if (!user) {
    throw new Error("Username doesn't exist");
  }
  setUser(newUser);
  console.log(`User set to: ${newUser}`);
}

export async function handlerRegister(cmdName: string, ...args: string[]) {
  if (args.length !== 1) {
    throw new Error("Usage: register <username>");
  }
  const newUser = args[0];
  try {
    const user = await createUser(newUser);
    setUser(user.name);
    console.log(`Registered user: ${user.name}`);
    console.log(user);
  } catch (err: any) {
    throw new Error("failed to register user: " + newUser);
  }
}

export async function handlerReset(cmdName: string, ...args: string[]) {
  await deleteAllUsers();
  console.log("Delete all users in db");
}

export function registerCommand(
  registry: CommandsRegistry,
  cmdName: string,
  handler: CommandHandler,
) {
  registry[cmdName] = handler;
}

export async function handlerListUsers(cmd: string, ...args: string[]) {
  const users = await getUsers();
  for (const user of users) {
    const current = user.name === config.currentUserName ? " (current)" : "";
    console.log(`  ${user.name}${current}`);
  }
}

export async function handlerAgg(cmd: string, ...args: string[]) {
  if (args.length !== 1) {
    throw new Error("Usage: agg <time_between_reqs>, ex: 1s, 1m, 1h");
  }
  const regex = /^(\d+)(ms|s|m|h)$/;
  const match = args[0].match(regex);

  if (!match) {
    throw new Error("Invalid time format. Use something like 1s, 5m, or 2h");
  }
  console.log(`Collecting feeds every ${match[0]}${match[1]}`);

  const milliseconds = convertToMilliseconds(match);
  await runScrapeCycle();
  const interval = setInterval(async () => {
    await runScrapeCycle();
  }, milliseconds);
  await new Promise<void>((resolve) => {
    process.on("SIGINT", () => {
      console.log("\nShutting down feed aggregator...");
      clearInterval(interval);
      resolve();
    });
  });
}

export const handlerAddFeed: UserCommandHandler = async (_, user, ...args) => {
  if (args.length !== 2) {
    throw new Error("Usage: add-feed <name> <url>");
  }
  const [feedName, feedUrl] = args;
  const newFeed = await createFeed(feedName, feedUrl, user.id);
  printFeed(newFeed, user);

  const result = await createFeedFollow(user.id, newFeed.id);
  console.log(`Followed ${result.feedName} by ${result.userName}`);
};

export async function handlerListFeeds(cmd: string, ...args: string[]) {
  // const feeds: Feed[] = await getFeeds();
  // for (const feed of feeds) {
  //   const user = await getUserByID(feed.userId);
  //   console.log(`  ${feed.name} (${feed.url}) - ${user.name}`);
  // }
  const results = await getFeedsWithUserName();
  for (const r of results) {
    const feed = `${r.feeds.name} (${r.feeds.url})`;
    console.log(`${feed.padEnd(50)} - ${r.users.name}`);
  }
}

export const handlerFeedFollow: UserCommandHandler = async (
  _,
  user,
  ...args
) => {
  if (args.length !== 1) {
    throw new Error("Usage: follow <feedUrl>");
  }
  const feedUrl = args[0];

  const feed = await getFeedByUrl(feedUrl);
  if (!feed) {
    throw new Error("Feed not found");
  }
  try {
    const result = await createFeedFollow(user.id, feed.id);
    console.log(`Followed ${result.feedName} by ${result.userName}`);
  } catch (error) {
    console.error(error);
  }
};

export const handlerFollowing: UserCommandHandler = async (
  _,
  user,
  ...args
) => {
  const results = await getFeedFollowsForUser(user.name);
  for (const r of results) {
    console.log(`${r.feedName} (${r.userName})`);
  }
};

export const handlerUnfollow: UserCommandHandler = async (_, user, ...args) => {
  if (args.length !== 1) {
    throw new Error("Usage: unfollow <feedUrl>");
  }
  const url = args[0];
  const deletedRecord = await deleteFeedFollow(user.id, url);
  if (!deletedRecord) {
    throw new Error(
      `Could not unfollow: You aren't following a feed with URL '${url}'`,
    );
  }
  console.log(`Unfollowed ${url} by ${user.name}`);
};

export async function runCommand(
  registry: CommandsRegistry,
  cmdName: string,
  ...args: string[]
) {
  const handler = registry[cmdName];
  if (!handler) {
    throw new Error(`Command ${cmdName} not found`);
  }
  await handler(cmdName, ...args);
}

async function runScrapeCycle() {
  try {
    await scrapeFeeds();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`❌ [${new Date().toLocaleTimeString()}] Error: ${msg}`);
  }
}

function convertToMilliseconds(match: RegExpMatchArray): number {
  const [, value, unit] = match;
  const num = parseInt(value);
  switch (unit) {
    case "ms":
      return num;
    case "s":
      return num * 1000;
    case "m":
      return num * 60 * 1000;
    case "h":
      return num * 60 * 60 * 1000;
    default:
      throw new Error(`Unknown time unit: ${unit}`);
  }
}
