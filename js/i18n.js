(function () {
  const STRINGS = {
    en: {
      nav_home: "Home",
      nav_archive: "Archive",
      nav_events: "Events",
      nav_about: "About",
      nav_youth: "Youth",
      nav_groups: "Groups",
      nav_games: "Games",
      nav_find: "Find us",
      cta_current: "Read this issue",
      cta_archive: "All issues",
      rack_title: "Still on the rack",
      play_title: "Play a round",
      play_all: "All games",
      latest_title: "Current issue",
      from_issue: "From this issue",
      archive_title: "Archive",
      events_title: "Events",
      events_empty: "No events posted yet.",
      about_title: "About",
      about_empty: "This page is waiting to be written.",
      youth_title: "Youth group",
      youth_empty: "The youth group will fill this in.",
      groups_title: "Groups",
      groups_empty: "Group listings will appear here.",
      games_title: "Games",
      games_fun: "Just for fun",
      games_parish: "For Mass",
      pass_offline: "Editing needs the newsletter server. Type hello world once npm start is running.",
      pass_denied: "That didn't unlock editing.",
      ordo_help: "Move each line with the arrows, then check the order.",
      find_title: "Find us",
      mass_link: "Mass times on the parish site",
      map_link: "Map",
      download: "Download PDF",
      back_archive: "Back to archive",
      footer_by: "Published by the parish youth group",
      tag_youth: "Youth",
      tag_parish: "Parish",
      menu: "Menu",
      admin_title: "Admin",
      admin_lock: "Lock",
      admin_save: "Save",
      admin_upload: "Upload",
      reader_missing: "Issue not found.",
      game_best: "Best",
      game_score: "Score",
      game_start: "Start",
      game_again: "Play again",
      game_check: "Check order",
      game_correct: "Correct",
      game_wrong: "Not yet",
    },
    es: {
      nav_home: "Inicio",
      nav_archive: "Archivo",
      nav_events: "Eventos",
      nav_about: "Acerca de",
      nav_youth: "Jóvenes",
      nav_groups: "Grupos",
      nav_games: "Juegos",
      nav_find: "Encuéntranos",
      cta_current: "Leer este número",
      cta_archive: "Todos los números",
      rack_title: "Sigue en el estante",
      play_title: "Una ronda",
      play_all: "Todos los juegos",
      latest_title: "Número actual",
      from_issue: "De este número",
      archive_title: "Archivo",
      events_title: "Eventos",
      events_empty: "Aún no hay eventos publicados.",
      about_title: "Acerca de",
      about_empty: "Esta página espera ser escrita.",
      youth_title: "Grupo juvenil",
      youth_empty: "El grupo juvenil completará esto.",
      groups_title: "Grupos",
      groups_empty: "Los grupos aparecerán aquí.",
      games_title: "Juegos",
      games_fun: "Solo por jugar",
      games_parish: "Para la Misa",
      pass_offline: "Para editar hace falta el servidor. Escribe hello world con npm start.",
      pass_denied: "Eso no abrió la edición.",
      ordo_help: "Mueve cada línea con las flechas y comprueba el orden.",
      find_title: "Encuéntranos",
      mass_link: "Horarios de Misa en el sitio parroquial",
      map_link: "Mapa",
      download: "Descargar PDF",
      back_archive: "Volver al archivo",
      footer_by: "Publicado por el grupo juvenil parroquial",
      tag_youth: "Jóvenes",
      tag_parish: "Parroquia",
      menu: "Menú",
      admin_title: "Admin",
      admin_lock: "Bloquear",
      admin_save: "Guardar",
      admin_upload: "Subir",
      reader_missing: "Número no encontrado.",
      game_best: "Mejor",
      game_score: "Puntos",
      game_start: "Empezar",
      game_again: "Otra vez",
      game_check: "Comprobar orden",
      game_correct: "Correcto",
      game_wrong: "Aún no",
    },
  };

  function getLang() {
    return localStorage.getItem("ep-lang") === "es" ? "es" : "en";
  }

  function setLang(lang) {
    localStorage.setItem("ep-lang", lang === "es" ? "es" : "en");
    document.documentElement.lang = getLang();
    apply();
    window.dispatchEvent(new CustomEvent("ep:lang"));
  }

  function t(key) {
    const lang = getLang();
    return (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;
  }

  function pick(obj) {
    if (!obj) return "";
    if (typeof obj === "string") return obj;
    const lang = getLang();
    return obj[lang] || obj.en || obj.es || "";
  }

  function apply() {
    document.documentElement.lang = getLang();
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll(".lang-toggle button").forEach((btn) => {
      btn.setAttribute("aria-pressed", btn.dataset.lang === getLang() ? "true" : "false");
    });
  }

  window.EP = window.EP || {};
  window.EP.i18n = { t, pick, getLang, setLang, apply, STRINGS };
})();
