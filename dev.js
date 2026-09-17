/* eslint-disable @typescript-eslint/no-require-imports */
const { spawn } = require("node:child_process");

const rawArgs = process.argv.slice(2);
const mappedArgs = [];

for (let i = 0; i < rawArgs.length; i++) {
  const arg = rawArgs[i];
  if (arg === "--host") {
    mappedArgs.push("--hostname");
  } else if (arg.startsWith("--host=")) {
    mappedArgs.push("--hostname=" + arg.slice(7));
  } else {
    mappedArgs.push(arg);
  }
}

const hasHost = mappedArgs.some(
  (a) => a === "-H" || a === "--hostname" || a.startsWith("--hostname=")
);
if (!hasHost) {
  mappedArgs.push("-H", "0.0.0.0");
}

const hasPort = mappedArgs.some(
  (a) => a === "-p" || a === "--port" || a.startsWith("--port=")
);
if (!hasPort) {
  mappedArgs.push("-p", "3000");
}

const child = spawn("next", ["dev", ...mappedArgs], {
  stdio: "inherit",
  env: process.env,
});

process.on("SIGTERM", () => {
  child.kill("SIGTERM");
});

process.on("SIGINT", () => {
  child.kill("SIGINT");
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});
