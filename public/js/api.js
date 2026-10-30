(function () {
  const REPO = "ErdTheTurd/ygnewsletter";

  function resolve(path) {
    if (window.EP && typeof window.EP.url === "function") return window.EP.url(path);
    return path;
  }

  function localKey(path) {
    return "ep-edit:" + String(path || "").split("?")[0];
  }

  function readLocal(path) {
    try {
      const raw = localStorage.getItem(localKey(path));
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function writeLocal(path, body) {
    localStorage.setItem(localKey(path), JSON.stringify(body));
  }

  function isStaticHost(status) {
    return status === 0 || status === 404 || status === 405 || status === 501;
  }

  function resourceKey(path) {
    return String(path || "").split("?")[0].replace(/\.json$/, "").split("/").pop();
  }

  function comparable(doc) {
    if (!doc || !Array.isArray(doc.issues)) return doc;
    return {
      ...doc,
      issues: doc.issues.map((issue) => {
        const copy = { ...issue };
        delete copy.pdfUrl;
        delete copy.coverUrl;
        return copy;
      }),
    };
  }

  function sameDoc(local, remote) {
    try {
      return JSON.stringify(comparable(local)) === JSON.stringify(comparable(remote));
    } catch (err) {
      return false;
    }
  }

  async function fetchJson(path) {
    const url = resolve(path);
    let res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!res.ok && !String(path).endsWith(".json")) {
      res = await fetch(url + ".json", { headers: { Accept: "application/json" }, cache: "no-store" });
    }
    if (!res.ok) throw new Error("Request failed: " + path);
    return res.json();
  }

  async function get(path) {
    let remote = null;
    try {
      remote = await fetchJson(path);
    } catch (err) {
      remote = null;
    }
    const local = readLocal(path);
    if (local && remote && sameDoc(local, remote)) {
      localStorage.removeItem(localKey(path));
      return remote;
    }
    if (local) return local;
    if (remote) return remote;
    throw new Error("Request failed: " + path);
  }

  function bytesToB64(bytes) {
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  async function gzipB64(text) {
    if (typeof CompressionStream !== "function") return null;
    const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
    const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    return bytesToB64(bytes);
  }

  function issueUrl(issueBody, key) {
    return (
      "https://github.com/" + REPO + "/issues/new?title=" +
      encodeURIComponent("newsletter: " + key) +
      "&body=" + encodeURIComponent(issueBody)
    );
  }

  async function publishUrl(key, body, passphrase) {
    const payload = {
      passphrase: passphrase,
      key: key,
      body: body,
      files: (window.EP.api.pendingFiles || []).slice(),
    };
    const json = JSON.stringify(payload);
    const intro = "Publishes the " + key + " page on the public newsletter.\n\nnewsletter-edit\n";
    let url = issueUrl(intro + json + "\n", key);
    if (url.length > 7500) {
      const packed = await gzipB64(json);
      if (!packed) throw new Error("That edit is too big to publish from this page.");
      url = issueUrl(intro + "gz:" + packed + "\n", key);
    }
    if (url.length > 7500) throw new Error("That edit is too big to publish from this page.");
    window.EP.api.pendingFiles = [];
    return url;
  }

  async function put(path, body, passphrase) {
    window.EP.api.savedLocally = false;
    let res = null;
    try {
      res = await fetch(resolve(path), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-edit-passphrase": passphrase,
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      res = null;
    }
    if (res && res.ok) {
      const type = res.headers.get("content-type") || "";
      if (type.includes("json")) {
        localStorage.removeItem(localKey(path));
        window.EP.api.pendingFiles = [];
        return res.json();
      }
    }
    if (res && !res.ok && !isStaticHost(res.status)) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Save failed");
    }
    const url = await publishUrl(resourceKey(path), body, passphrase);
    try {
      writeLocal(path, body);
    } catch (err) {
      throw new Error("This browser can't store that edit.");
    }
    window.EP.api.publishUrls = window.EP.api.publishUrls || [];
    window.EP.api.publishUrls.push(url);
    return { ok: true, publishUrl: url };
  }

  function safeFileName(name) {
    const clean = String(name || "file").replace(/[^A-Za-z0-9._-]/g, "_").replace(/^\.+/, "").slice(-60);
    return Date.now() + "-" + (clean || "file");
  }

  async function upload(file, kind, passphrase) {
    let res = null;
    try {
      const fd = new FormData();
      fd.append("file", file);
      res = await fetch(resolve("/api/upload?kind=" + encodeURIComponent(kind || "uploads")), {
        method: "POST",
        headers: { "x-edit-passphrase": passphrase },
        body: fd,
      });
    } catch (err) {
      res = null;
    }
    if (res && res.ok) {
      const type = res.headers.get("content-type") || "";
      if (type.includes("json")) return res.json();
    }
    if (res && !res.ok && !isStaticHost(res.status)) throw new Error("Upload failed");
    if (file.size > 20000) throw new Error("That file is too big to publish from this page.");
    const dir = kind === "issues" || kind === "covers" ? "issues" : "uploads";
    const name = safeFileName(file.name);
    const data = bytesToB64(new Uint8Array(await file.arrayBuffer()));
    window.EP.api.pendingFiles = window.EP.api.pendingFiles || [];
    window.EP.api.pendingFiles.push({ name: name, dir: dir, data: data });
    const publicPath = "/" + dir + "/" + name;
    return { ok: true, filename: name, path: publicPath, url: publicPath };
  }

  async function checkAuth(passphrase) {
    try {
      const res = await fetch(resolve("/api/auth/check"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase }),
      });
      const type = res.headers.get("content-type") || "";
      if (res.status === 401) {
        window.EP.api.staticHost = false;
        return 401;
      }
      if (res.status === 200 && type.includes("json")) {
        const body = await res.json().catch(() => null);
        if (body && body.ok) {
          window.EP.api.staticHost = false;
          return 200;
        }
      }
      if (isStaticHost(res.status) || !type.includes("json")) {
        window.EP.api.staticHost = true;
        return 204;
      }
      window.EP.api.staticHost = false;
      return res.status;
    } catch (err) {
      window.EP.api.staticHost = true;
      return 204;
    }
  }

  window.EP = window.EP || {};
  window.EP.api = {
    get: get,
    put: put,
    upload: upload,
    checkAuth: checkAuth,
    savedLocally: false,
    staticHost: false,
    publishUrls: [],
    pendingFiles: [],
  };
})();
