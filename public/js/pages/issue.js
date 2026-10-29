(function () {
  async function init() {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    const data = await window.EP.api.get("/api/issues");
    const issue = (data.issues || []).find((i) => i.id === id);
    const title = document.getElementById("issue-title");
    const frame = document.getElementById("issue-frame");
    const download = document.getElementById("issue-download");
    const missing = document.getElementById("issue-missing");

    if (!issue) {
      if (missing) missing.hidden = false;
      if (frame) frame.hidden = true;
      return;
    }
    if (title) title.textContent = window.EP.i18n.pick(issue.title);
    if (frame) {
      frame.src = "/issues/" + issue.file;
      frame.hidden = false;
    }
    if (download) {
      download.href = "/issues/" + issue.file;
      download.download = issue.file;
    }
    window.addEventListener("ep:lang", () => {
      if (title) title.textContent = window.EP.i18n.pick(issue.title);
    });
  }
  init().catch(console.error);
})();
