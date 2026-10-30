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

  function esc(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }

  function normalize(list) {
    return (list || []).map((ev, index) => ({
      id: ev.id || "ev-" + index + "-" + (ev.date || "new"),
      date: ev.date || "",
      tag: ev.tag === "parish" ? "parish" : "youth",
      title: { en: ev.title?.en || "", es: ev.title?.es || "" },
      place: { en: ev.place?.en || "", es: ev.place?.es || "" },
      body: { en: ev.body?.en || "", es: ev.body?.es || "" },
    }));
  }

  function isoDate(value) {
    const text = String(value || "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    const us = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (!us) return text;
    return us[3] + "-" + us[1].padStart(2, "0") + "-" + us[2].padStart(2, "0");
  }

  function readCards() {
    const cards = document.querySelectorAll("#event-cards .edit-card");
    data.events = Array.from(cards).map((card) => {
      const value = (name) => card.querySelector('[data-field="' + name + '"]').value.trim();
      return {
        id: card.dataset.id,
        date: isoDate(value("date")),
        tag: value("tag") === "parish" ? "parish" : "youth",
        title: { en: value("title-en"), es: value("title-es") },
        place: { en: value("place-en"), es: value("place-es") },
        body: { en: value("body-en"), es: value("body-es") },
      };
    });
  }

  function cardHtml(ev, index) {
    return `<article class="edit-card" data-id="${esc(ev.id)}">
      <div class="edit-card__head">
        <strong>Event ${index + 1}</strong>
        <button type="button" class="edit-remove" data-remove>Remove</button>
      </div>
      <div class="edit-grid">
        <div>
          <label>Date</label>
          <input data-field="date" value="${esc(ev.date)}" placeholder="2026-10-31" inputmode="numeric">
        </div>
        <div>
          <label>Who</label>
          <select data-field="tag">
            <option value="youth"${ev.tag === "youth" ? " selected" : ""}>Youth</option>
            <option value="parish"${ev.tag === "parish" ? " selected" : ""}>Parish</option>
          </select>
        </div>
      </div>
      <div class="edit-grid">
        <div><label>Title EN</label><input data-field="title-en" value="${esc(ev.title.en)}"></div>
        <div><label>Title ES</label><input data-field="title-es" value="${esc(ev.title.es)}"></div>
      </div>
      <div class="edit-grid">
        <div><label>Place EN</label><input data-field="place-en" value="${esc(ev.place.en)}"></div>
        <div><label>Place ES</label><input data-field="place-es" value="${esc(ev.place.es)}"></div>
      </div>
      <label>Details EN</label>
      <textarea class="edit-short" data-field="body-en">${esc(ev.body.en)}</textarea>
      <label>Details ES</label>
      <textarea class="edit-short" data-field="body-es">${esc(ev.body.es)}</textarea>
    </article>`;
  }

  function paintCards() {
    const box = document.getElementById("event-cards");
    if (!box) return;
    if (!data.events.length) {
      box.innerHTML = '<p class="edit-empty">No events yet. Add the next one.</p>';
      return;
    }
    box.innerHTML = data.events.map(cardHtml).join("");
  }

  window.EP.mountAdminPanel = function (root) {
    data.events = normalize(data.events);
    root.innerHTML = `
      <div id="event-cards"></div>
      <button type="button" class="edit-add" id="add-event">Add event</button>
    `;
    const box = document.getElementById("event-cards");
    box.addEventListener("input", () => { readCards(); render(); });
    box.addEventListener("change", () => { readCards(); render(); });
    box.addEventListener("click", (event) => {
      const button = event.target.closest("[data-remove]");
      if (!button) return;
      readCards();
      const id = button.closest(".edit-card").dataset.id;
      data.events = data.events.filter((ev) => ev.id !== id);
      paintCards();
      render();
    });
    document.getElementById("add-event").addEventListener("click", () => {
      readCards();
      data.events.push({
        id: "ev-" + Date.now(),
        date: "",
        tag: "youth",
        title: { en: "", es: "" },
        place: { en: "", es: "" },
        body: { en: "", es: "" },
      });
      paintCards();
    });
    paintCards();
  };

  window.EP.saveAdmin = async function (pass) {
    readCards();
    data.events = data.events.filter((ev) =>
      ev.date || ev.title.en || ev.title.es || ev.place.en || ev.place.es || ev.body.en || ev.body.es
    );
    paintCards();
    await window.EP.api.put("/api/events", { events: data.events }, pass);
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
