import os from "node:os";
import fs from "node:fs";
import path from "node:path";

type Config = {
  dbUrl: string;
  currentUserName: string;
};

const CONFIG_PATH = ".gatorconfig.json";

export function setUser(user: string) {
  const config = readConfig();
  config.currentUserName = user;
  writeConfig(config);
}

export function readConfig(): Config {
  const config_path = getConfigFilePath();
  const config = fs.readFileSync(config_path, "utf-8");
  const rawConfig = JSON.parse(config);
  return validateConfig(rawConfig);
}

function getConfigFilePath(): string {
  const homeDir = os.homedir();
  return path.join(homeDir, CONFIG_PATH);
}

function writeConfig(cfg: Config): void {
  const config_path = getConfigFilePath();
  const dataToSave = {
    db_url: cfg.dbUrl,
    current_user_name: cfg.currentUserName,
  };

  fs.writeFileSync(config_path, JSON.stringify(dataToSave, null, 2));
}

function validateConfig(rawConfig: any): Config {
  if (!rawConfig || typeof rawConfig !== "object") {
    throw new Error("Invalid config file");
  }
  if (!rawConfig.db_url || typeof rawConfig.db_url !== "string") {
    throw new Error("Invalid dbUrl in config file");
  }
  return {
    dbUrl: rawConfig.db_url,
    currentUserName: rawConfig.current_user_name || "",
  } as Config;
}
