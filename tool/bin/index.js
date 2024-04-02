#!/usr/bin/env node
import arg from "arg";
import chalk from "chalk";

import { scan } from "../src/scan.js";
import { stat } from "../src/stat.js";

try {
  const args = arg({
    "--add": String,
    "--scan": String,
  });

  let folder = args["--add"];

  if (folder) {
    scan(folder);
  } else {
    stat("sumitparida2002@gmail.com");
  }
} catch (e) {
  console.log(chalk.yellow(e.message));
  console.log();
  usage();
}

function usage() {
  console.log(`${chalk.whiteBright("tool [CMD]")}
    ${chalk.greenBright("--add")}\tAdd a new folder to scan for Git repositories
    ${chalk.greenBright("--scan")}\tthe email to scan`);
}
