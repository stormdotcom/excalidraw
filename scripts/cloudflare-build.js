#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const rootDirectory = path.resolve(__dirname, "..");
const appDirectory = path.join(rootDirectory, "excalidraw-app");
const binaryDirectory = path.join(rootDirectory, "node_modules", ".bin");

const environment = {
  ...process.env,
  PATH: `${binaryDirectory}${path.delimiter}${process.env.PATH || ""}`,
  VITE_APP_ENABLE_TRACKING: process.env.VITE_APP_ENABLE_TRACKING || "false",
  VITE_APP_GIT_SHA:
    process.env.VITE_APP_GIT_SHA ||
    process.env.CF_PAGES_COMMIT_SHA ||
    process.env.CF_COMMIT_SHA ||
    "",
};

const run = (script, args, workingDirectory) => {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: workingDirectory,
    env: environment,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
};

run(
  path.join(rootDirectory, "node_modules", "vite", "bin", "vite.js"),
  ["build"],
  appDirectory,
);
run(path.join(rootDirectory, "scripts", "build-version.js"), [], appDirectory);
