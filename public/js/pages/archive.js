(function () {
  let issuesData = { issues: [] };

  function formatDate(iso) {
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString(window.EP.i18n.getLang() === "es" ? "es-MX" : "en-US", {
      month: "short",
      day: "numeric",
    });
  }

  function render() {
    const root = document.getElementById("archive-root");
    if (!root) return;
    const byYear = {};
    for (const issue of issuesData.issues || []) {
      const y = (issue.date || "").slice(0, 4) || "Undated";
      (byYear[y] = byYear[y] || []).push(issue);
    }
    const years = Object.keys(byYear).sort((a, b) => (a < b ? 1 : -1));
    root.innerHTML = years
      .map((year) => {
        const tiles = byYear[year]
          .map(
            (issue) => `
          <a class="cover-tile" href="${window.EP.url("/issue.html?id=" + encodeURIComponent(issue.id))}">
            <div class="cover">${issue.cover ? `<img src="${window.EP.url("/issues/" + issue.cover)}" alt="">` : ""}</div>
            <div class="cover-tile__meta">
              <strong>${window.EP.i18n.pick(issue.title)}</strong>
              <span>${formatDate(issue.date)}</span>
            </div>
          </a>`
          )
          .join("");
        return `<section class="year-block"><h2>${year}</h2><div class="cover-grid">${tiles}</div></section>`;
      })
      .join("");
  }

  window.EP.mountAdminPanel = function (root) {
    root.innerHTML = `<p style="color:var(--muted);font-size:0.85rem">Upload new issues from the home page admin panel.</p>`;
  };
  window.EP.saveAdmin = async () => "Nothing to save here.";

  async function init() {
    issuesData = await window.EP.api.get("/api/issues");
    render();
    window.addEventListener("ep:lang", render);
  }
  init().catch(console.error);
})();
