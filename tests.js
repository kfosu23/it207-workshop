#!/usr/bin/env node
"use strict";

const assert = require("node:assert");
const { grep } = require("./grep");
const { head } = require("./head");
const { findFirst } = require("./findfirst");

const LOG = "samples/server.log";
const EMPTY = "samples/empty.txt";
const ONELINE = "samples/oneline.txt";
const MESSY = "samples/messy.txt";

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  PASS  ${name}`);
    passed++;
  } catch (err) {
    console.log(`  FAIL  ${name}`);
    console.log(`        ${err.message}`);
    failed++;
  }
}

async function run() {
  console.log("\ngrep");
  await test("finds all matching lines", () => {
    assert.strictEqual(grep("ERROR", LOG).length, 5);
  });
  await test("returns empty array when nothing matches", () => {
    assert.deepStrictEqual(grep("FATAL", LOG), []);
  });
  await test("is case sensitive by default", () => {
    assert.strictEqual(grep("error", LOG).length, 0);
  });
  await test("ignoreCase option works", () => {
    assert.strictEqual(grep("error", LOG, { ignoreCase: true }).length, 5);
  });
  await test("empty file returns no matches", () => {
    assert.deepStrictEqual(grep("anything", EMPTY), []);
  });
  await test("file with no trailing newline still matches", () => {
    assert.strictEqual(grep("one line", ONELINE).length, 1);
  });
  await test("does not emit a phantom empty final line", () => {
    const all = grep("", MESSY);
    assert.ok(!all.some((l, i) => i === all.length - 1 && l === ""));
  });

  console.log("\nhead");
  await test("returns the first n lines", async () => {
    const lines = await head(LOG, 3);
    assert.strictEqual(lines.length, 3);
    assert.ok(lines[0].includes("Server started"));
  });
  await test("defaults to 10 lines", async () => {
    assert.strictEqual((await head(LOG)).length, 10);
  });
  await test("n larger than the file returns the whole file", async () => {
    assert.strictEqual((await head(LOG, 500)).length, 15);
  });
  await test("n of 0 returns nothing", async () => {
    assert.deepStrictEqual(await head(LOG, 0), []);
  });
  await test("negative n returns nothing", async () => {
    assert.deepStrictEqual(await head(LOG, -5), []);
  });
  await test("empty file returns nothing", async () => {
    assert.deepStrictEqual(await head(EMPTY, 5), []);
  });
  await test("lines do not include newline characters", async () => {
    const lines = await head(LOG, 2);
    assert.ok(lines.every((l) => !l.includes("\n")));
  });

  console.log("\nfindFirst");
  await test("stops after n matches", async () => {
    const matches = await findFirst("ERROR", LOG, 2);
    assert.strictEqual(matches.length, 2);
  });
  await test("reports correct line numbers", async () => {
    const matches = await findFirst("ERROR", LOG, 2);
    assert.strictEqual(matches[0].lineNumber, 4);
    assert.strictEqual(matches[1].lineNumber, 6);
  });
  await test("returns fewer than n when the file has fewer matches", async () => {
    const matches = await findFirst("ERROR", LOG, 99);
    assert.strictEqual(matches.length, 5);
  });
  await test("no matches returns empty array", async () => {
    assert.deepStrictEqual(await findFirst("FATAL", LOG, 5), []);
  });
  await test("empty pattern returns empty array", async () => {
    assert.deepStrictEqual(await findFirst("", LOG, 5), []);
  });
  await test("n of 0 returns empty array", async () => {
    assert.deepStrictEqual(await findFirst("ERROR", LOG, 0), []);
  });
  await test("ignoreCase option works", async () => {
    const matches = await findFirst("error", LOG, 3, { ignoreCase: true });
    assert.strictEqual(matches.length, 3);
  });
  await test("empty file returns empty array", async () => {
    assert.deepStrictEqual(await findFirst("ERROR", EMPTY, 5), []);
  });
  await test("missing file rejects instead of crashing", async () => {
    await assert.rejects(() => findFirst("ERROR", "samples/nope.log", 5));
  });

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
