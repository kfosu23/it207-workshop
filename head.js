#!/usr/bin/env node
"use strict";

const fs = require("fs");
const readline = require("readline");

/**
 * Return the first n lines of filePath.
 * This streams the file instead of loading it, so it stops reading
 * once it has n lines. On a large file that matters.
 */
function head(filePath, n = 10) {
  return new Promise((resolve, reject) => {
    if (n <= 0) {
      resolve([]);
      return;
    }

    const lines = [];
    let done = false;
    const stream = fs.createReadStream(filePath, { encoding: "utf8" });
    stream.on("error", reject);

    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    rl.on("line", (line) => {
      // readline emits every line already buffered from the current chunk,
      // even after close() is called. Without this guard, a small file
      // returns all of its lines instead of just n.
      if (done) return;
      lines.push(line);
      if (lines.length >= n) {
        done = true;
        rl.close();
        stream.destroy();
      }
    });

    rl.on("close", () => resolve(lines));
    rl.on("error", reject);
  });
}

async function main() {
  const args = process.argv.slice(2);
  let n = 10;
  const positional = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-n") {
      n = parseInt(args[i + 1], 10);
      i++;
      if (Number.isNaN(n)) {
        console.error("head: invalid line count");
        process.exit(1);
      }
    } else {
      positional.push(args[i]);
    }
  }

  if (positional.length < 1) {
    console.error("Usage: node head.js [-n <count>] <file>");
    process.exit(1);
  }

  const filePath = positional[0];

  try {
    const lines = await head(filePath, n);
    for (const line of lines) {
      console.log(line);
    }
  } catch (err) {
    if (err.code === "ENOENT") {
      console.error(`head: ${filePath}: No such file or directory`);
    } else {
      console.error(`head: ${err.message}`);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { head };
