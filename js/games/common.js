(function () {
  function scoreKey(name) {
    return "ep-game-" + name;
  }

  function getBest(name) {
    const v = localStorage.getItem(scoreKey(name));
    return v ? Number(v) : 0;
  }

  function setBest(name, score) {
    const prev = getBest(name);
    if (score > prev) localStorage.setItem(scoreKey(name), String(score));
    return Math.max(score, prev);
  }

  function setBestTime(name, ms) {
    const key = scoreKey(name) + "-time";
    const prev = localStorage.getItem(key);
    if (!prev || ms < Number(prev)) localStorage.setItem(key, String(ms));
    return Number(localStorage.getItem(key));
  }

  function getBestTime(name) {
    const v = localStorage.getItem(scoreKey(name) + "-time");
    return v ? Number(v) : null;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function shell(title) {
    return `
      <div class="game-shell">
        <p><a href="${window.EP.url("/games.html")}">← Games</a></p>
        <h1>${title}</h1>
        <div class="game-meta" id="game-meta"></div>
        <div class="game-board" id="game-board"></div>
        <div class="btn-row" style="margin-top:1rem" id="game-actions"></div>
      </div>`;
  }

  window.EP = window.EP || {};
  window.EP.games = { getBest, setBest, setBestTime, getBestTime, shuffle, shell };
})();
