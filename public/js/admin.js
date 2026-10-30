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

  function showToast(message) {
    let toast = document.getElementById("pass-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "pass-toast";
      toast.className = "pass-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      toast.hidden = true;
    }, 4200);
  }

  async function unlock(pass) {
    const status = await window.EP.api.checkAuth(pass);
    if (status === 401) {
      showToast(window.EP.i18n.t("pass_denied"));
      return false;
    }
    if (status !== 200 && status !== 204) {
      showToast(window.EP.i18n.t("pass_offline"));
      return false;
    }
    unlocked = true;
    passphrase = pass;
    document.body.classList.add("is-admin");
    ensureBar();
    document.getElementById("admin-bar").classList.add("is-open");
    if (status === 204) setStatusOk(window.EP.i18n.t("admin_local_open"));
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
        const popup = window.EP.api.staticHost ? window.open("", "_blank") : null;
        window.EP.api.publishUrls = [];
        window.EP.saveAdmin(passphrase).then((msg) => {
          const urls = window.EP.api.publishUrls || [];
          if (urls[0] && popup) popup.location.href = urls[0];
          if (urls.length) setStatusOk(window.EP.i18n.t("admin_publish"), urls);
          else {
            if (popup) popup.close();
            setStatusOk(msg || "Saved.");
          }
        }).catch((err) => {
          if (popup) popup.close();
          setStatusErr(err);
        });
      }
    });
    window.EP.i18n.apply();
  }

  function setStatusOk(msg, hrefs) {
    const el = document.getElementById("admin-status");
    if (!el) return;
    el.textContent = msg || "Saved.";
    el.className = "admin-bar__status is-ok";
    const list = Array.isArray(hrefs) ? hrefs : hrefs ? [hrefs] : [];
    list.forEach((href) => {
      el.appendChild(document.createTextNode(" "));
      const link = document.createElement("a");
      link.href = href;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = window.EP.i18n.t("admin_publish_link");
      el.appendChild(link);
    });
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
    buffer = (buffer + e.key.toLowerCase()).replace(/[^a-z]/g, "");
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
