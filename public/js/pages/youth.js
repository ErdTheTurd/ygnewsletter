(function () {
  let data = null;

  function render() {
    const title = document.getElementById("youth-title");
    const body = document.getElementById("youth-body");
    const join = document.getElementById("youth-join");
    const img = document.getElementById("youth-image");
    const empty = document.getElementById("youth-empty");
    const t = window.EP.i18n.pick(data.title);
    const b = window.EP.i18n.pick(data.body);
    const j = window.EP.i18n.pick(data.join);
    if (title) title.textContent = t || window.EP.i18n.t("youth_title");
    if (body) body.textContent = b;
    if (join) join.textContent = j;
    if (img) {
      if (data.image) {
        img.hidden = false;
        img.src = data.image;
      } else img.hidden = true;
    }
    if (empty) empty.hidden = !!(t || b || j || data.image);
  }

  window.EP.mountAdminPanel = function (root) {
    root.innerHTML = `
      <label>Title EN</label><input id="a-title-en" value="${(data.title?.en || "").replace(/"/g, "&quot;")}">
      <label>Title ES</label><input id="a-title-es" value="${(data.title?.es || "").replace(/"/g, "&quot;")}">
      <label>Body EN</label><textarea id="a-body-en">${(data.body?.en || "").replace(/</g, "&lt;")}</textarea>
      <label>Body ES</label><textarea id="a-body-es">${(data.body?.es || "").replace(/</g, "&lt;")}</textarea>
      <label>Join EN</label><textarea id="a-join-en">${(data.join?.en || "").replace(/</g, "&lt;")}</textarea>
      <label>Join ES</label><textarea id="a-join-es">${(data.join?.es || "").replace(/</g, "&lt;")}</textarea>
      <label>Photo</label><input type="file" id="a-image" accept="image/*">
    `;
  };

  window.EP.saveAdmin = async function (pass) {
    data.title = { en: document.getElementById("a-title-en").value, es: document.getElementById("a-title-es").value };
    data.body = { en: document.getElementById("a-body-en").value, es: document.getElementById("a-body-es").value };
    data.join = { en: document.getElementById("a-join-en").value, es: document.getElementById("a-join-es").value };
    const file = document.getElementById("a-image").files[0];
    if (file) {
      const up = await window.EP.api.upload(file, "uploads", pass);
      data.image = up.path;
    }
    await window.EP.api.put("/api/youth", data, pass);
    render();
    return "Youth saved.";
  };

  async function init() {
    data = await window.EP.api.get("/api/youth");
    render();
    window.addEventListener("ep:lang", render);
  }
  init().catch(console.error);
})();
