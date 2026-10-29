(function () {
  let homeData = null;
  let issuesData = null;

  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString(window.EP.i18n.getLang() === "es" ? "es-MX" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function render() {
    const latest = (issuesData.issues || [])[0];
    const cover = document.getElementById("latest-cover");
    const meta = document.getElementById("latest-meta");
    const cta = document.getElementById("cta-current");
    const from = document.getElementById("from-issue");
    const tagline = document.getElementById("hero-tagline");

    if (tagline) tagline.textContent = window.EP.i18n.pick(homeData.tagline);

    if (!latest) {
      if (meta) meta.innerHTML = "";
      return;
    }

    if (cover) {
      cover.href = window.EP.url("/issue.html?id=" + encodeURIComponent(latest.id));
      cover.innerHTML = latest.cover
        ? `<img src="${window.EP.url("/issues/" + latest.cover)}" alt="">`
        : "";
    }
    if (meta) {
      meta.innerHTML = `<strong>${window.EP.i18n.pick(latest.title)}</strong><span>${formatDate(latest.date)}</span>`;
    }
    if (cta) cta.href = window.EP.url("/issue.html?id=" + encodeURIComponent(latest.id));

    const blurb = window.EP.i18n.pick(homeData.fromIssue);
    const wrap = document.getElementById("from-issue-wrap");
    if (wrap) {
      if (blurb) {
        wrap.hidden = false;
        from.textContent = blurb;
      } else {
        wrap.hidden = true;
      }
    }

    const rack = document.getElementById("more-issues");
    const rackSection = document.getElementById("rack");
    if (rack && rackSection) {
      const rest = (issuesData.issues || []).slice(1);
      rackSection.hidden = rest.length === 0;
      rack.innerHTML = rest
        .map((issue) => {
          const img = issue.cover
            ? `<img src="${window.EP.url("/issues/" + issue.cover)}" alt="">`
            : "";
          return `<a class="cover-tile" href="${window.EP.url("/issue.html?id=" + encodeURIComponent(issue.id))}">
            <div class="cover">${img}</div>
            <div class="cover-tile__meta"><strong>${window.EP.i18n.pick(issue.title)}</strong><span>${formatDate(issue.date)}</span></div>
          </a>`;
        })
        .join("");
    }
  }

  window.EP.mountAdminPanel = function (root) {
    if (!root || !homeData) return;
    root.innerHTML = `
      <label>Tagline EN</label><input id="a-tag-en" value="${escapeAttr(homeData.tagline?.en || "")}">
      <label>Tagline ES</label><input id="a-tag-es" value="${escapeAttr(homeData.tagline?.es || "")}">
      <label>From this issue EN</label><textarea id="a-from-en">${escapeHtml(homeData.fromIssue?.en || "")}</textarea>
      <label>From this issue ES</label><textarea id="a-from-es">${escapeHtml(homeData.fromIssue?.es || "")}</textarea>
      <label>Upload newsletter PDF</label><input type="file" id="a-pdf" accept="application/pdf">
      <label>Cover image</label><input type="file" id="a-cover" accept="image/*,.svg">
      <label>Issue date (YYYY-MM-DD)</label><input id="a-date" placeholder="2026-10-05">
      <label>Issue title EN</label><input id="a-title-en">
      <label>Issue title ES</label><input id="a-title-es">
    `;
  };

  window.EP.saveAdmin = async function (pass) {
    homeData = {
      tagline: {
        en: document.getElementById("a-tag-en").value,
        es: document.getElementById("a-tag-es").value,
      },
      fromIssue: {
        en: document.getElementById("a-from-en").value,
        es: document.getElementById("a-from-es").value,
      },
    };
    await window.EP.api.put("/api/home", homeData, pass);

    const pdf = document.getElementById("a-pdf").files[0];
    const cover = document.getElementById("a-cover").files[0];
    const date = document.getElementById("a-date").value.trim();
    if (pdf && date) {
      const up = await window.EP.api.upload(pdf, "issues", pass);
      let coverName = null;
      if (cover) {
        const cup = await window.EP.api.upload(cover, "covers", pass);
        coverName = cup.filename;
      }
      const manifest = await window.EP.api.get("/api/issues");
      const id = date;
      const entry = {
        id,
        date,
        title: {
          en: document.getElementById("a-title-en").value || date,
          es: document.getElementById("a-title-es").value || date,
        },
        file: up.filename,
        cover: coverName,
        sample: false,
      };
      manifest.issues = [entry, ...(manifest.issues || []).filter((i) => i.id !== id)];
      manifest.issues.sort((a, b) => (a.date < b.date ? 1 : -1));
      await window.EP.api.put("/api/issues", { issues: manifest.issues }, pass);
      issuesData = await window.EP.api.get("/api/issues");
    }
    render();
    return "Home saved.";
  };

  function escapeAttr(s) {
    return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }
  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }

  async function init() {
    [homeData, issuesData] = await Promise.all([
      window.EP.api.get("/api/home"),
      window.EP.api.get("/api/issues"),
    ]);
    render();
    window.addEventListener("ep:lang", render);
  }

  init().catch(console.error);
})();
