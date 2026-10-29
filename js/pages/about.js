(function () {
  let data = null;

  function render() {
    const title = document.getElementById("about-title");
    const body = document.getElementById("about-body");
    const img = document.getElementById("about-image");
    const empty = document.getElementById("about-empty");
    const t = window.EP.i18n.pick(data.title);
    const b = window.EP.i18n.pick(data.body);
    if (title) title.textContent = t || window.EP.i18n.t("about_title");
    if (body) body.textContent = b;
    if (img) {
      if (data.image) {
        img.hidden = false;
        img.src = data.image;
      } else {
        img.hidden = true;
      }
    }
    if (empty) empty.hidden = !!(t || b || data.image);
  }

  window.EP.mountAdminPanel = function (root) {
    root.innerHTML = `
      <label>Title EN</label><input id="a-title-en" value="${(data.title?.en || "").replace(/"/g, "&quot;")}">
      <label>Title ES</label><input id="a-title-es" value="${(data.title?.es || "").replace(/"/g, "&quot;")}">
      <label>Body EN</label><textarea id="a-body-en">${(data.body?.en || "").replace(/</g, "&lt;")}</textarea>
      <label>Body ES</label><textarea id="a-body-es">${(data.body?.es || "").replace(/</g, "&lt;")}</textarea>
      <label>Photo</label><input type="file" id="a-image" accept="image/*">
    `;
  };

  window.EP.saveAdmin = async function (pass) {
    data.title = { en: document.getElementById("a-title-en").value, es: document.getElementById("a-title-es").value };
    data.body = { en: document.getElementById("a-body-en").value, es: document.getElementById("a-body-es").value };
    const file = document.getElementById("a-image").files[0];
    if (file) {
      const up = await window.EP.api.upload(file, "uploads", pass);
      data.image = up.path;
    }
    await window.EP.api.put("/api/about", data, pass);
    render();
    return "About saved.";
  };

  async function init() {
    data = await window.EP.api.get("/api/about");
    render();
    window.addEventListener("ep:lang", render);
  }
  init().catch(console.error);
})();
