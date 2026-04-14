import { readConfig, setUser } from "./config.js";

function main() {
  let config = readConfig();
  setUser("John");
  config = readConfig();
  console.log(config);
}

main();
