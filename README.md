# EP Newsletter

Youth-group site for Immaculate Conception Church (FSSP), El Paso. Newsletter archive, parish life pages, bilingual EN/ES, games, and a secret admin mode.

## Run locally

```bash
npm install
npm start
```

Open http://localhost:3000

The public site is https://erdtheturd.github.io/ygnewsletter/ . `npm run pages` refreshes the static files Pages serves from the repository root. Saves and uploads still need this Node server.

Admin mode is unlocked by typing the configured passphrase outside a form field. Escape locks it again. Set `EDIT_PASSPHRASE` to change it. On GitHub Pages, Save opens a GitHub issue, and that issue is published only when the repository owner opened it. `npm start` still saves straight to the JSON files on this machine.

## Public API (FSSP iOS-ready)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/issues` | Manifest + absolute `pdfUrl` / `coverUrl` |
| GET | `/api/events` | Event list |
| GET | `/api/about` | About fields EN/ES |
| GET | `/api/youth` | Youth group fields |
| GET | `/api/groups` | Groups |
| GET | `/api/findus` | Contact |
| GET | `/api/home` | Tagline + from-issue blurb |
| GET | `/api/games` | Game decks |
| GET | `/api/health` | Liveness |

Writes use `PUT /api/{resource}` with header `x-edit-passphrase`. Uploads: `POST /api/upload?kind=uploads|issues|covers`.

## Stack

Node + Express, static frontend, JSON files under `data/`, PDFs under `issues/`.
