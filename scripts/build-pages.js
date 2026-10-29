#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const out = path.join(root, "docs");
const origin = (
  process.env.PAGES_ORIGIN || "https://erdtheturd.github.io/ygnewsletter"
).replace(/\/$/, "");

fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(path.join(root, "public"), out, { recursive: true });
fs.cpSync(path.join(root, "issues"), path.join(out, "issues"), { recursive: true });

const uploadsSrc = path.join(root, "data", "uploads");
const uploadsDest = path.join(out, "uploads");
fs.mkdirSync(uploadsDest, { recursive: true });
for (const name of fs.readdirSync(uploadsSrc)) {
  if (name === ".gitkeep") continue;
  fs.cpSync(path.join(uploadsSrc, name), path.join(uploadsDest, name), { recursive: true });
}

const resources = ["home", "events", "about", "youth", "groups", "findus", "games"];
const apiDir = path.join(out, "api");
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
fs.writeFileSync(path.join(out, ".nojekyll"), "");

console.log(`Wrote GitHub Pages site to ${out}`);
