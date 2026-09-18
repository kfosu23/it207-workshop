#!/usr/bin/env node
"use strict";

const fs = require("fs");

/**
 * Return every line in filePath that contains pattern.
 * grep has to read the whole file, because a match can appear anywhere.
 */
function grep(pattern, filePath, options = {}) {
  const ignoreCase = options.ignoreCase === true;
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split("\n");
  const needle = ignoreCase ? pattern.toLowerCase() : pattern;
  const matches = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // A trailing newline produces one empty element at the end. Skip it.
    if (i === lines.length - 1 && line === "") continue;
    const haystack = ignoreCase ? line.toLowerCase() : line;
    if (haystack.includes(needle)) {
      matches.push(line);
    }
  }

  return matches;
}

function main() {
  const args = process.argv.slice(2);
  const ignoreCase = args.includes("-i");
  const positional = args.filter((a) => a !== "-i");

  if (positional.length < 2) {
    console.error("Usage: node grep.js [-i] <pattern> <file>");
    process.exit(1);
  }

  const [pattern, filePath] = positional;

  try {
    const matches = grep(pattern, filePath, { ignoreCase });
    for (const line of matches) {
      console.log(line);
    }
    // grep exits 1 when nothing matched, same as the real command.
    process.exit(matches.length > 0 ? 0 : 1);
  } catch (err) {
    if (err.code === "ENOENT") {
      console.error(`grep: ${filePath}: No such file or directory`);
    } else {
      console.error(`grep: ${err.message}`);
    }
    process.exit(2);
  }
}

if (require.main === module) {
  main();
}

module.exports = { grep };
