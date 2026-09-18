#!/usr/bin/env node
"use strict";

const fs = require("fs");
const readline = require("readline");

/**
 * FindFirst: scan a file for a pattern and stop as soon as n matches are found.
 *
 * This is grep and head in one pass. Piping grep into head makes grep scan the
 * entire file even after head has what it needs. FindFirst breaks out of the
 * loop at the nth match and never reads the rest of the file.
 *
 * Returns an array of { lineNumber, text } so callers know where matches were.
 */
function findFirst(pattern, filePath, n = 5, options = {}) {
  return new Promise((resolve, reject) => {
    if (n <= 0 || pattern === "") {
      resolve([]);
      return;
    }

    const ignoreCase = options.ignoreCase === true;
    const needle = ignoreCase ? pattern.toLowerCase() : pattern;
    const matches = [];
    let lineNumber = 0;
    let done = false;

    const stream = fs.createReadStream(filePath, { encoding: "utf8" });
    stream.on("error", reject);

    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    rl.on("line", (line) => {
      // readline emits every line already buffered from the current chunk,
      // even after close() is called. This guard makes the early exit real.
      if (done) return;
      lineNumber++;
      const haystack = ignoreCase ? line.toLowerCase() : line;
      if (haystack.includes(needle)) {
        matches.push({ lineNumber, text: line });
        if (matches.length >= n) {
          done = true;
          rl.close();
          stream.destroy(); // early exit: the rest of the file is never read
        }
      }
    });

    rl.on("close", () => resolve(matches));
    rl.on("error", reject);
  });
}

async function main() {
  const args = process.argv.slice(2);
  let n = 5;
  let ignoreCase = false;
  let showLineNumbers = false;
  const positional = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-n") {
      n = parseInt(args[i + 1], 10);
      i++;
      if (Number.isNaN(n)) {
        console.error("findfirst: invalid match count");
        process.exit(1);
      }
    } else if (args[i] === "-i") {
      ignoreCase = true;
    } else if (args[i] === "-l") {
      showLineNumbers = true;
    } else {
      positional.push(args[i]);
    }
  }

  if (positional.length < 2) {
    console.error(
      "Usage: node findfirst.js [-n <count>] [-i] [-l] <pattern> <file>"
    );
    process.exit(1);
  }

  const [pattern, filePath] = positional;

  try {
    const matches = await findFirst(pattern, filePath, n, { ignoreCase });

    if (matches.length === 0) {
      console.error(`findfirst: no matches for "${pattern}" in ${filePath}`);
      process.exit(1);
    }

    for (const match of matches) {
      if (showLineNumbers) {
        console.log(`${match.lineNumber}: ${match.text}`);
      } else {
        console.log(match.text);
      }
    }
  } catch (err) {
    if (err.code === "ENOENT") {
      console.error(`findfirst: ${filePath}: No such file or directory`);
    } else {
      console.error(`findfirst: ${err.message}`);
    }
    process.exit(2);
  }
}

if (require.main === module) {
  main();
}

module.exports = { findFirst };
