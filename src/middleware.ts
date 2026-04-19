import { CommandHandler } from "./commands.js";
import { User } from "./db/queries/users.js";
import { config } from "./config.js";
import { getUserByName } from "./db/queries/users.js";

export type UserCommandHandler = (
  cmdName: string,
  user: User,
  ...args: string[]
) => Promise<void>;

type MiddlewareLoggedIn = (handler: UserCommandHandler) => CommandHandler;

export function middlewareLoggedIn(
  handler: UserCommandHandler,
): CommandHandler {
  return async (cmdName: string, ...args: string[]) => {
    const user = await getUserByName(config.currentUserName);
    if (!user) {
      throw new Error(`User ${config.currentUserName} not found`);
    }
    return handler(cmdName, user, ...args);
  };
}
