(function () {
  let data = { events: [] };

  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString(window.EP.i18n.getLang() === "es" ? "es-MX" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function render() {
    const root = document.getElementById("events-root");
    const list = (data.events || []).slice().sort((a, b) => (a.date > b.date ? 1 : -1));
    if (!list.length) {
      root.innerHTML = `<div class="empty" data-i18n="events_empty">${window.EP.i18n.t("events_empty")}</div>`;
      return;
    }
    root.innerHTML =
      '<ul class="event-list">' +
      list
        .map((ev) => {
          const tag =
            ev.tag === "youth"
              ? window.EP.i18n.t("tag_youth")
              : window.EP.i18n.t("tag_parish");
          return `<li class="event-item">
            <div class="event-item__date">${formatDate(ev.date)}<div class="event-item__tag">${tag}</div></div>
            <div>
              <strong>${window.EP.i18n.pick(ev.title)}</strong>
              <div>${window.EP.i18n.pick(ev.place)}</div>
              <p>${window.EP.i18n.pick(ev.body)}</p>
            </div>
          </li>`;
        })
        .join("") +
      "</ul>";
  }

  window.EP.mountAdminPanel = function (root) {
    const json = JSON.stringify(data.events || [], null, 2);
    root.innerHTML = `
      <label>Events JSON</label>
      <textarea id="a-events" style="min-height:220px">${json.replace(/</g, "&lt;")}</textarea>
      <p style="font-size:0.75rem;color:var(--muted)">Fields: id, date, tag (youth|parish), title{en,es}, place{en,es}, body{en,es}</p>
    `;
  };

  window.EP.saveAdmin = async function (pass) {
    const parsed = JSON.parse(document.getElementById("a-events").value);
    data = { events: parsed };
    await window.EP.api.put("/api/events", data, pass);
    render();
    return "Events saved.";
  };

  async function init() {
    data = await window.EP.api.get("/api/events");
    render();
    window.addEventListener("ep:lang", render);
  }
  init().catch(console.error);
})();
