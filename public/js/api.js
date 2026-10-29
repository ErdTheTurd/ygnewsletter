(function () {
  async function get(path) {
    const res = await fetch(path, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("Request failed: " + path);
    return res.json();
  }

  async function put(path, body, passphrase) {
    const res = await fetch(path, {
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
    const res = await fetch("/api/upload?kind=" + encodeURIComponent(kind || "uploads"), {
      method: "POST",
      headers: { "x-edit-passphrase": passphrase },
      body: fd,
    });
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  }

  async function checkAuth(passphrase) {
    const res = await fetch("/api/auth/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passphrase }),
    });
    return res.ok;
  }

  window.EP = window.EP || {};
  window.EP.api = { get, put, upload, checkAuth };
})();
