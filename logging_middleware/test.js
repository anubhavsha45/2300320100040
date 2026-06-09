const Log = require("./logger");

async function run() {
  await Log("backend", "error", "handler", "received string, expected bool");
}

run();
