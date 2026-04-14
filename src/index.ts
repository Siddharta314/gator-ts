import {
  CommandsRegistry,
  handlerLogin,
  registerCommand,
  runCommand,
} from "./commands.js";

async function main() {
  const commanderRegistry: CommandsRegistry = {};
  registerCommand(commanderRegistry, "login", handlerLogin);

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
