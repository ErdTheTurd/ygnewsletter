(function () {
  function currentPath() {
    const base = (window.EP_BASE || "/").replace(/\/$/, "");
    let path = location.pathname;
    if (base && path.indexOf(base) === 0) path = path.slice(base.length) || "/";
    path = path.replace(/\.html$/, "");
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
    if (path === "/index") path = "/";
    return path || "/";
  }

  const PATH = currentPath();

  function navItems() {
    return [
      { href: "/", key: "nav_home", match: "/" },
      { href: "/archive", key: "nav_archive", match: "/archive" },
      { href: "/events", key: "nav_events", match: "/events" },
      { href: "/about", key: "nav_about", match: "/about" },
      { href: "/games", key: "nav_games", match: "/games" },
    ];
  }

  function renderHeader() {
    const header = document.getElementById("site-header");
    if (!header) return;
    const links = navItems()
      .map((item) => {
        const current =
          item.match === "/"
            ? PATH === "/"
            : PATH === item.match || PATH.startsWith(item.match + "/");
        return `<a href="${window.EP.url(item.href)}" data-i18n="${item.key}"${current ? ' aria-current="page"' : ""}></a>`;
      })
      .join("");

    header.innerHTML = `
      <div class="site-header__inner">
        <a class="brand" href="${window.EP.url("/")}"><span class="brand__mark">EP</span><span class="brand__word">Newsletter</span></a>
        <button type="button" class="menu-btn" id="menu-btn" data-i18n="menu">Menu</button>
        <nav class="nav" id="site-nav">${links}
          <div class="lang-toggle" role="group" aria-label="Language">
            <button type="button" data-lang="en" aria-pressed="true">EN</button>
            <button type="button" data-lang="es" aria-pressed="false">ES</button>
          </div>
        </nav>
      </div>`;

    header.querySelectorAll(".lang-toggle button").forEach((btn) => {
      btn.addEventListener("click", () => window.EP.i18n.setLang(btn.dataset.lang));
    });
    const menuBtn = header.querySelector("#menu-btn");
    const nav = header.querySelector("#site-nav");
    menuBtn.addEventListener("click", () => nav.classList.toggle("is-open"));
  }

  function renderFooter() {
    const footer = document.getElementById("site-footer");
    if (!footer) return;
    footer.innerHTML = `
      <div class="site-footer__inner">
        <div><strong>EP Newsletter</strong><br><span data-i18n="footer_by"></span></div>
        <div>Immaculate Conception Church, FSSP<br>El Paso, Texas</div>
      </div>`;
  }

  function boot() {
    renderHeader();
    renderFooter();
    window.EP.i18n.apply();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
