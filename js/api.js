(function () {
  function resolve(path) {
    if (window.EP && typeof window.EP.url === "function") return window.EP.url(path);
    return path;
  }

  async function get(path) {
    const url = resolve(path);
    let res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok && !String(path).endsWith(".json")) {
      res = await fetch(url + ".json", { headers: { Accept: "application/json" } });
    }
    if (!res.ok) throw new Error("Request failed: " + path);
    return res.json();
  }

  async function put(path, body, passphrase) {
    const res = await fetch(resolve(path), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-edit-passphrase": passphrase,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Save failed");
    }
    return res.json();
  }

  async function upload(file, kind, passphrase) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(resolve("/api/upload?kind=" + encodeURIComponent(kind || "uploads")), {
      method: "POST",
      headers: { "x-edit-passphrase": passphrase },
      body: fd,
    });
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  }

  async function checkAuth(passphrase) {
    try {
      const res = await fetch(resolve("/api/auth/check"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase }),
      });
      return res.status;
    } catch (err) {
      return 0;
    }
  }

  window.EP = window.EP || {};
  window.EP.api = { get, put, upload, checkAuth };
})();
