#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = process.env.DATA_ROOT || path.join(__dirname, "..");
const ORIGIN = (
  process.env.PAGES_ORIGIN || "https://erdtheturd.github.io/ygnewsletter"
).replace(/\/$/, "");

const FILES = {
  home: "home.json",
  events: "events.json",
  about: "about.json",
  youth: "youth.json",
  groups: "groups.json",
  findus: "findus.json",
  games: "games.json",
  issues: "issues-manifest.json",
};

function normPass(value) {
  return String(value || "").toLowerCase().replace(/[^a-z]/g, "");
}

function extract(body) {
  const text = String(body || "");
  const packed = text.match(/newsletter-edit\s+(gz:[A-Za-z0-9+/=\s]+)/);
  if (packed) {
    const b64 = packed[1].slice(3).replace(/\s+/g, "");
    const json = zlib.gunzipSync(Buffer.from(b64, "base64")).toString("utf8");
    return JSON.parse(json);
  }
  const plain = text.match(/newsletter-edit\s+(\{[\s\S]*\})/);
  if (!plain) return null;
  return JSON.parse(plain[1]);
}

function safeName(name) {
  const base = path.basename(String(name || ""));
  if (!/^[0-9]{10,}-[A-Za-z0-9._-]+$/.test(base)) {
    throw new Error("Rejected file name");
  }
  return base;
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}

function publishedIssues(body) {
  const issues = (body.issues || []).map((issue) => {
    const copy = { ...issue };
    delete copy.pdfUrl;
    delete copy.coverUrl;
    return copy;
  });
  return { issues };
}

function apiIssues(body) {
  const stored = publishedIssues(body);
  return {
    issues: stored.issues.map((issue) => ({
      ...issue,
      pdfUrl: issue.file ? `${ORIGIN}/issues/${issue.file}` : null,
      coverUrl: issue.cover ? `${ORIGIN}/issues/${issue.cover}` : null,
    })),
  };
}

function applyEdit(issueBody) {
  const payload = extract(issueBody);
  if (!payload || typeof payload !== "object") return { ok: false, reason: "missing edit" };
  if (normPass(payload.passphrase) !== "helloworld") return { ok: false, reason: "rejected" };
  const key = payload.key;
  if (!FILES[key] || !payload.body || typeof payload.body !== "object") {
    return { ok: false, reason: "rejected" };
  }
  const files = Array.isArray(payload.files) ? payload.files : [];
  try {
    for (const file of files) {
      if (!file || (file.dir !== "issues" && file.dir !== "uploads")) {
        return { ok: false, reason: "rejected" };
      }
      const name = safeName(file.name);
      const data = Buffer.from(String(file.data || ""), "base64");
      if (!data.length || data.length > 30000) return { ok: false, reason: "file too large" };
      const dest = path.join(ROOT, file.dir, name);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, data);
      if (file.dir === "uploads") {
        const mirror = path.join(ROOT, "data", "uploads", name);
        fs.mkdirSync(path.dirname(mirror), { recursive: true });
        fs.writeFileSync(mirror, data);
      }
    }
  } catch (err) {
    return { ok: false, reason: "rejected" };
  }
  const stored = key === "issues" ? publishedIssues(payload.body) : payload.body;
  const api = key === "issues" ? apiIssues(payload.body) : payload.body;
  writeJson(path.join(ROOT, "data", FILES[key]), stored);
  writeJson(path.join(ROOT, "api", key + ".json"), api);
  return { ok: true, key };
}

function main() {
  const resultPath = process.env.EDIT_RESULT || "";
  let result;
  try {
    result = applyEdit(process.env.ISSUE_BODY || "");
  } catch (err) {
    result = { ok: false, reason: "rejected" };
  }
  if (resultPath) fs.writeFileSync(resultPath, JSON.stringify(result));
  if (!result.ok) {
    console.error(result.reason || "rejected");
    process.exitCode = 2;
    return;
  }
  console.log("Applied " + result.key);
}

if (require.main === module) main();

module.exports = { applyEdit, extract };
