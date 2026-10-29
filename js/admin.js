(function () {
  const SEQUENCE = "helloworld";
  let buffer = "";
  let unlocked = false;
  let passphrase = "";

  function isAdmin() {
    return unlocked;
  }

  function lock() {
    unlocked = false;
    passphrase = "";
    document.body.classList.remove("is-admin");
    const bar = document.getElementById("admin-bar");
    if (bar) bar.classList.remove("is-open");
    window.dispatchEvent(new CustomEvent("ep:admin", { detail: { unlocked: false } }));
  }

  async function unlock(pass) {
    const ok = await window.EP.api.checkAuth(pass);
    if (!ok) return false;
    unlocked = true;
    passphrase = pass;
    document.body.classList.add("is-admin");
    ensureBar();
    document.getElementById("admin-bar").classList.add("is-open");
    window.dispatchEvent(new CustomEvent("ep:admin", { detail: { unlocked: true } }));
    if (typeof window.EP.mountAdminPanel === "function") {
      window.EP.mountAdminPanel(document.getElementById("admin-panel-root"));
    }
    return true;
  }

  function ensureBar() {
    if (document.getElementById("admin-bar")) return;
    const bar = document.createElement("div");
    bar.id = "admin-bar";
    bar.className = "admin-bar";
    bar.innerHTML =
      '<h2 data-i18n="admin_title">Admin</h2>' +
      '<div id="admin-panel-root"></div>' +
      '<div class="admin-bar__actions">' +
      '<button type="button" class="btn" id="admin-save" data-i18n="admin_save">Save</button>' +
      '<button type="button" class="btn btn--ghost" id="admin-lock" data-i18n="admin_lock">Lock</button>' +
      "</div>" +
      '<div class="admin-bar__status" id="admin-status"></div>';
    document.body.appendChild(bar);
    bar.querySelector("#admin-lock").addEventListener("click", lock);
    bar.querySelector("#admin-save").addEventListener("click", () => {
      if (typeof window.EP.saveAdmin === "function") {
        window.EP.saveAdmin(passphrase).then(setStatusOk).catch(setStatusErr);
      }
    });
    window.EP.i18n.apply();
  }

  function setStatusOk(msg) {
    const el = document.getElementById("admin-status");
    if (!el) return;
    el.textContent = msg || "Saved.";
    el.className = "admin-bar__status is-ok";
  }

  function setStatusErr(err) {
    const el = document.getElementById("admin-status");
    if (!el) return;
    el.textContent = err && err.message ? err.message : String(err);
    el.className = "admin-bar__status is-err";
  }

  function onKey(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const target = e.target;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
      return;
    }
    if (e.key === "Escape" && unlocked) {
      lock();
      return;
    }
    if (e.key.length !== 1) return;
    buffer += e.key.toLowerCase();
    if (buffer.length > SEQUENCE.length) buffer = buffer.slice(-SEQUENCE.length);
    if (buffer === SEQUENCE) {
      buffer = "";
      unlock(SEQUENCE);
    }
  }

  document.addEventListener("keydown", onKey);

  window.EP = window.EP || {};
  window.EP.admin = {
    isAdmin,
    lock,
    unlock,
    getPassphrase: () => passphrase,
    setStatusOk,
    setStatusErr,
  };
})();
