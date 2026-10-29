(function () {
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

  async function get(path) {
    const local = readLocal(path);
    if (local) return local;
    const url = resolve(path);
    let res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok && !String(path).endsWith(".json")) {
      res = await fetch(url + ".json", { headers: { Accept: "application/json" } });
    }
    if (!res.ok) throw new Error("Request failed: " + path);
    return res.json();
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
        return res.json();
      }
    }
    if (res && !res.ok && !isStaticHost(res.status)) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Save failed");
    }
    try {
      writeLocal(path, body);
    } catch (err) {
      throw new Error("This browser can't store that edit.");
    }
    window.EP.api.savedLocally = true;
    return { ok: true, local: true };
  }

  function readAsDataUrl(file) {
    return new Promise((resolveFile, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolveFile(reader.result);
      reader.onerror = () => reject(new Error("Could not read that file."));
      reader.readAsDataURL(file);
    });
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
    if (kind === "issues" || kind === "covers") {
      throw new Error("Issue files publish from the newsletter server. Run npm start, then upload again.");
    }
    if (file.size > 900000) throw new Error("That image is too large to store in the browser.");
    const url = await readAsDataUrl(file);
    window.EP.api.savedLocally = true;
    return { ok: true, filename: file.name, path: url, url: url, local: true };
  }

  async function checkAuth(passphrase) {
    try {
      const res = await fetch(resolve("/api/auth/check"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase }),
      });
      const type = res.headers.get("content-type") || "";
      if (res.status === 401) return 401;
      if (res.status === 200 && type.includes("json")) {
        const body = await res.json().catch(() => null);
        if (body && body.ok) return 200;
      }
      if (isStaticHost(res.status) || !type.includes("json")) return 204;
      return res.status;
    } catch (err) {
      return 204;
    }
  }

  window.EP = window.EP || {};
  window.EP.api = { get, put, upload, checkAuth, savedLocally: false };
})();
