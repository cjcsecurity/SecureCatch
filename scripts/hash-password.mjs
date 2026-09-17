#!/usr/bin/env node

import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const password = Buffer.concat(chunks).toString("utf8").replace(/[\r\n]+$/, "");

if (password.length < 12) {
  console.error("Password must be at least 12 characters. Pipe it on stdin; it is never written to disk.");
  process.exit(1);
}

const cost = 16384;
const blockSize = 8;
const parallelization = 1;
const salt = randomBytes(16);
const hash = await scrypt(password, salt, 64, {
  N: cost,
  r: blockSize,
  p: parallelization,
  maxmem: 128 * 1024 * 1024,
});

process.stdout.write(
  `scrypt$${cost}$${blockSize}$${parallelization}$${salt.toString("hex")}$${hash.toString("hex")}\n`
);
