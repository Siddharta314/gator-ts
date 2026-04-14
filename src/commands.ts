import { setUser } from "./config.js";
import {
  createUser,
  getUserByName,
  deleteAllUsers,
  getUsers,
} from "./db/queries/users.js";
import { config } from "./config.js";
import { fetchFeed } from "./rssfeed.js";

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
  console.log("Fetching resource");
  const rssFeed = await fetchFeed("https://www.wagslane.dev/index.xml");
  console.log(JSON.stringify(rssFeed, null, 2));
}

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
