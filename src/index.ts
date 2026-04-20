import {
  CommandsRegistry,
  handlerLogin,
  handlerRegister,
  handlerReset,
  handlerListUsers,
  registerCommand,
  runCommand,
  handlerAgg,
  handlerAddFeed,
  handlerListFeeds,
  handlerFeedFollow,
  handlerFollowing,
  handlerUnfollow,
  handlerBrowse,
} from "./commands.js";
import { middlewareLoggedIn } from "./middleware.js";

async function main() {
  const commanderRegistry: CommandsRegistry = {};
  registerCommand(commanderRegistry, "login", handlerLogin);
  registerCommand(commanderRegistry, "register", handlerRegister);
  registerCommand(commanderRegistry, "reset", handlerReset);
  registerCommand(commanderRegistry, "users", handlerListUsers);
  registerCommand(commanderRegistry, "agg", handlerAgg);
  registerCommand(
    commanderRegistry,
    "addfeed",
    middlewareLoggedIn(handlerAddFeed),
  );
  registerCommand(commanderRegistry, "feeds", handlerListFeeds);
  registerCommand(
    commanderRegistry,
    "follow",
    middlewareLoggedIn(handlerFeedFollow),
  );
  registerCommand(
    commanderRegistry,
    "following",
    middlewareLoggedIn(handlerFollowing),
  );
  registerCommand(
    commanderRegistry,
    "unfollow",
    middlewareLoggedIn(handlerUnfollow),
  );
  registerCommand(
    commanderRegistry,
    "browse",
    middlewareLoggedIn(handlerBrowse),
  );

  const args = process.argv.slice(2);
  try {
    if (args.length === 0) {
      throw new Error("not enough arguments were provided");
    }
    const [cmdName, ...cmdArgs] = args;
    await runCommand(commanderRegistry, cmdName, ...cmdArgs);
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error: ${err.message}`);
    } else {
      console.error("An unknown error occurred");
    }
    process.exit(1);
  }

  process.exit(0);
}

main();
