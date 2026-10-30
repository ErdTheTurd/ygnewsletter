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

  function esc(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }

  function normalize(list) {
    return (list || []).map((group, index) => ({
      id: group.id || "group-" + index,
      name: { en: group.name?.en || "", es: group.name?.es || "" },
      body: { en: group.body?.en || "", es: group.body?.es || "" },
    }));
  }

  function readCards() {
    data.groups = Array.from(document.querySelectorAll("#group-cards .edit-card")).map((card) => {
      const value = (name) => card.querySelector('[data-field="' + name + '"]').value.trim();
      return {
        id: card.dataset.id,
        name: { en: value("name-en"), es: value("name-es") },
        body: { en: value("body-en"), es: value("body-es") },
      };
    });
  }

  function cardHtml(group, index) {
    const label = group.name.en || group.name.es || "Group " + (index + 1);
    return `<article class="edit-card" data-id="${esc(group.id)}">
      <div class="edit-card__head">
        <strong>${esc(label)}</strong>
        <button type="button" class="edit-remove" data-remove>Remove</button>
      </div>
      <div class="edit-grid">
        <div><label>Name EN</label><input data-field="name-en" value="${esc(group.name.en)}"></div>
        <div><label>Name ES</label><input data-field="name-es" value="${esc(group.name.es)}"></div>
      </div>
      <label>About EN</label>
      <textarea class="edit-short" data-field="body-en">${esc(group.body.en)}</textarea>
      <label>About ES</label>
      <textarea class="edit-short" data-field="body-es">${esc(group.body.es)}</textarea>
    </article>`;
  }

  function paintCards() {
    const box = document.getElementById("group-cards");
    if (!box) return;
    if (!data.groups.length) {
      box.innerHTML = '<p class="edit-empty">No groups yet.</p>';
      return;
    }
    box.innerHTML = data.groups.map(cardHtml).join("");
  }

  window.EP.mountAdminPanel = function (root) {
    data.groups = normalize(data.groups);
    root.innerHTML = `
      <div id="group-cards"></div>
      <button type="button" class="edit-add" id="add-group">Add group</button>
    `;
    const box = document.getElementById("group-cards");
    box.addEventListener("input", () => { readCards(); render(); });
    box.addEventListener("click", (event) => {
      const button = event.target.closest("[data-remove]");
      if (!button) return;
      readCards();
      const id = button.closest(".edit-card").dataset.id;
      data.groups = data.groups.filter((group) => group.id !== id);
      paintCards();
      render();
    });
    document.getElementById("add-group").addEventListener("click", () => {
      readCards();
      data.groups.push({
        id: "group-" + Date.now(),
        name: { en: "", es: "" },
        body: { en: "", es: "" },
      });
      paintCards();
    });
    paintCards();
  };

  window.EP.saveAdmin = async function (pass) {
    readCards();
    await window.EP.api.put("/api/groups", { groups: data.groups }, pass);
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
