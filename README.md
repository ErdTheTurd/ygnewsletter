# EP Newsletter

Youth-group site for Immaculate Conception Church (FSSP), El Paso. Newsletter archive, parish life pages, bilingual EN/ES, games, and a secret admin mode.

## Run locally

```bash
npm install
npm start
```

Open http://localhost:3000

The public site is https://erdtheturd.github.io/ygnewsletter/ . `npm run pages` refreshes the static files Pages serves from the repository root. Saves and uploads still need this Node server.

Admin: click the page and type `hello world` (a space is fine; not inside a form field). Escape locks again. Override with `EDIT_PASSPHRASE`. Editing only answers on the Node server, not on GitHub Pages.

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
