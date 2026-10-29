#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");
const origin = (
  process.env.PAGES_ORIGIN || "https://erdtheturd.github.io/ygnewsletter"
).replace(/\/$/, "");

for (const name of fs.readdirSync(publicDir)) {
  fs.cpSync(path.join(publicDir, name), path.join(root, name), { recursive: true });
}

const uploadsSrc = path.join(root, "data", "uploads");
const uploadsDest = path.join(root, "uploads");
fs.mkdirSync(uploadsDest, { recursive: true });
for (const name of fs.readdirSync(uploadsSrc)) {
  if (name === ".gitkeep") continue;
  fs.cpSync(path.join(uploadsSrc, name), path.join(uploadsDest, name), { recursive: true });
}

const resources = ["home", "events", "about", "youth", "groups", "findus", "games"];
const apiDir = path.join(root, "api");
fs.mkdirSync(apiDir, { recursive: true });
for (const name of resources) {
  const data = JSON.parse(fs.readFileSync(path.join(root, "data", `${name}.json`), "utf8"));
  fs.writeFileSync(path.join(apiDir, `${name}.json`), JSON.stringify(data, null, 2) + "\n");
}

const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "data", "issues-manifest.json"), "utf8")
);
const issues = (manifest.issues || []).map((issue) => ({
  ...issue,
  pdfUrl: issue.file ? `${origin}/issues/${issue.file}` : null,
  coverUrl: issue.cover ? `${origin}/issues/${issue.cover}` : null,
}));
fs.writeFileSync(
  path.join(apiDir, "issues.json"),
  JSON.stringify({ ...manifest, issues }, null, 2) + "\n"
);
fs.writeFileSync(
  path.join(apiDir, "health.json"),
  JSON.stringify({ ok: true, service: "ep-newsletter" }) + "\n"
);
fs.writeFileSync(path.join(root, ".nojekyll"), "");

console.log("Wrote GitHub Pages files at the repository root");
