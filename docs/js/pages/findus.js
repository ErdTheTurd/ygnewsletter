(function () {
  let data = null;

  function render() {
    document.getElementById("find-name").textContent = window.EP.i18n.pick(data.name);
    document.getElementById("find-address").textContent = data.address || "";
    document.getElementById("find-phone").textContent = data.phone || "";
    document.getElementById("find-phone").href = "tel:" + String(data.phone || "").replace(/[^\d+]/g, "");
    document.getElementById("find-email").textContent = data.email || "";
    document.getElementById("find-email").href = "mailto:" + (data.email || "");
    document.getElementById("find-hours").textContent = window.EP.i18n.pick(data.hours);
    document.getElementById("find-printed").textContent = window.EP.i18n.pick(data.printed);
    document.getElementById("find-notes").textContent = window.EP.i18n.pick(data.notes);
    const parish = document.getElementById("find-parish");
    parish.href = data.parishSite || "https://www.fsspelpaso.com/";
    const map = document.getElementById("find-map");
    map.href = data.mapUrl || "#";
  }

  window.EP.mountAdminPanel = function (root) {
    root.innerHTML = `
      <label>Notes EN</label><textarea id="a-notes-en">${(data.notes?.en || "").replace(/</g, "&lt;")}</textarea>
      <label>Notes ES</label><textarea id="a-notes-es">${(data.notes?.es || "").replace(/</g, "&lt;")}</textarea>
      <label>Printed note EN</label><textarea id="a-printed-en">${(data.printed?.en || "").replace(/</g, "&lt;")}</textarea>
      <label>Printed note ES</label><textarea id="a-printed-es">${(data.printed?.es || "").replace(/</g, "&lt;")}</textarea>
    `;
  };

  window.EP.saveAdmin = async function (pass) {
    data.notes = { en: document.getElementById("a-notes-en").value, es: document.getElementById("a-notes-es").value };
    data.printed = { en: document.getElementById("a-printed-en").value, es: document.getElementById("a-printed-es").value };
    await window.EP.api.put("/api/findus", data, pass);
    render();
    return "Find us saved.";
  };

  async function init() {
    data = await window.EP.api.get("/api/findus");
    render();
    window.addEventListener("ep:lang", render);
  }
  init().catch(console.error);
})();
