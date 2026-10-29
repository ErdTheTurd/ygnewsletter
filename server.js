const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const multer = require("multer");

const ROOT = __dirname;
const DATA = path.join(ROOT, "data");
const ISSUES = path.join(ROOT, "issues");
const UPLOADS = path.join(DATA, "uploads");
const PUBLIC = path.join(ROOT, "public");

const PORT = process.env.PORT || 3000;
const EDIT_PASSPHRASE = process.env.EDIT_PASSPHRASE || "helloworld";

for (const dir of [DATA, ISSUES, UPLOADS]) {
  fs.mkdirSync(dir, { recursive: true });
}

const DATA_FILES = {
  about: "about.json",
  events: "events.json",
  groups: "groups.json",
  youth: "youth.json",
  findus: "findus.json",
  home: "home.json",
  games: "games.json",
  issues: "issues-manifest.json",
};

function readJson(name, fallback) {
  const file = path.join(DATA, DATA_FILES[name] || name);
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(name, value) {
  const file = path.join(DATA, DATA_FILES[name] || name);
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function absoluteUrl(req, rel) {
  if (!rel) return null;
  if (/^https?:\/\//i.test(rel)) return rel;
  const base = `${req.protocol}://${req.get("host")}`;
  return base + (rel.startsWith("/") ? rel : "/" + rel);
}

function withIssueUrls(req, manifest) {
  const issues = (manifest.issues || []).map((issue) => ({
    ...issue,
    pdfUrl: absoluteUrl(req, issue.file ? `/issues/${issue.file}` : null),
    coverUrl: absoluteUrl(
      req,
      issue.cover ? `/issues/${issue.cover}` : null
    ),
  }));
  return { ...manifest, issues };
}

function requirePassphrase(req, res, next) {
  const provided =
    req.get("x-edit-passphrase") ||
    (req.body && req.body.passphrase) ||
    req.query.passphrase;
  if (provided !== EDIT_PASSPHRASE) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const kind = req.query.kind || req.body.kind || "uploads";
    const dest =
      kind === "issues" ? ISSUES : kind === "covers" ? ISSUES : UPLOADS;
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename(req, file, cb) {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const stamp = Date.now();
    cb(null, `${stamp}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use("/issues", express.static(ISSUES));
app.use("/uploads", express.static(UPLOADS));

/* Public read API: stable for future FSSP iOS consumption */
app.get("/api/issues", (req, res) => {
  res.json(withIssueUrls(req, readJson("issues", { issues: [] })));
});

app.get("/api/events", (req, res) => {
  res.json(readJson("events", { events: [] }));
});

app.get("/api/about", (req, res) => {
  res.json(readJson("about", { title: { en: "", es: "" }, body: { en: "", es: "" }, image: null }));
});

app.get("/api/youth", (req, res) => {
  res.json(readJson("youth", { title: { en: "", es: "" }, body: { en: "", es: "" }, image: null }));
});

app.get("/api/groups", (req, res) => {
  res.json(readJson("groups", { groups: [] }));
});

app.get("/api/findus", (req, res) => {
  res.json(readJson("findus", {}));
});

app.get("/api/home", (req, res) => {
  res.json(readJson("home", { fromIssue: { en: "", es: "" } }));
});

app.get("/api/games", (req, res) => {
  res.json(readJson("games", {}));
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "ep-newsletter" });
});

/* Admin mutations */
const putKeys = ["about", "events", "groups", "youth", "findus", "home", "games", "issues"];

for (const key of putKeys) {
  app.put(`/api/${key}`, requirePassphrase, (req, res) => {
    const payload = { ...req.body };
    delete payload.passphrase;
    writeJson(key, payload);
    res.json({ ok: true, [key]: payload });
  });
}

app.post(
  "/api/upload",
  requirePassphrase,
  upload.single("file"),
  (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file" });
    const kind = req.query.kind || "uploads";
    const publicPath =
      kind === "issues" || kind === "covers"
        ? `/issues/${req.file.filename}`
        : `/uploads/${req.file.filename}`;
    res.json({
      ok: true,
      filename: req.file.filename,
      path: publicPath,
      url: absoluteUrl(req, publicPath),
    });
  }
);

app.post("/api/auth/check", (req, res) => {
  const ok = (req.body && req.body.passphrase) === EDIT_PASSPHRASE;
  res.status(ok ? 200 : 401).json({ ok });
});

/* Clean routes before static so /games is not treated as a directory listing */
const pages = [
  "archive",
  "issue",
  "events",
  "about",
  "youth",
  "groups",
  "games",
  "find-us",
];

for (const page of pages) {
  app.get(`/${page}`, (_req, res) => {
    res.sendFile(path.join(PUBLIC, `${page}.html`));
  });
}

app.get("/games/:slug", (req, res) => {
  const file = path.join(PUBLIC, "games", `${req.params.slug}.html`);
  if (fs.existsSync(file)) return res.sendFile(file);
  res.status(404).sendFile(path.join(PUBLIC, "404.html"));
});

app.use(express.static(PUBLIC));

app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Not found" });
  }
  res.status(404).sendFile(path.join(PUBLIC, "404.html"));
});

app.listen(PORT, () => {
  console.log(`EP Newsletter listening on ${PORT}`);
});
