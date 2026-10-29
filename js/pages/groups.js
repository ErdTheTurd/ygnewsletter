(function () {
  let data = { groups: [] };

  function render() {
    const root = document.getElementById("groups-root");
    const groups = data.groups || [];
    const filled = groups.filter((g) => window.EP.i18n.pick(g.name) || window.EP.i18n.pick(g.body));
    if (!filled.length) {
      root.innerHTML = `<div class="empty">${window.EP.i18n.t("groups_empty")}</div>`;
      return;
    }
    root.innerHTML =
      '<div class="group-list">' +
      filled
        .map(
          (g) => `<article class="group-item admin-editable">
            <h3>${window.EP.i18n.pick(g.name)}</h3>
            <p>${window.EP.i18n.pick(g.body)}</p>
          </article>`
        )
        .join("") +
      "</div>";
  }

  window.EP.mountAdminPanel = function (root) {
    root.innerHTML = `
      <label>Groups JSON</label>
      <textarea id="a-groups" style="min-height:220px">${JSON.stringify(data.groups || [], null, 2).replace(/</g, "&lt;")}</textarea>
    `;
  };

  window.EP.saveAdmin = async function (pass) {
    data = { groups: JSON.parse(document.getElementById("a-groups").value) };
    await window.EP.api.put("/api/groups", data, pass);
    render();
    return "Groups saved.";
  };

  async function init() {
    data = await window.EP.api.get("/api/groups");
    render();
    window.addEventListener("ep:lang", render);
  }
  init().catch(console.error);
})();
