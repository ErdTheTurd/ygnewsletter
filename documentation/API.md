# Public content API

Base URL: the live site origin (e.g. `https://YOUR.hostingersite.com`).

CORS is open. No auth for GET. Absolute PDF/cover URLs are included on `/api/issues`.

## Endpoints

### `GET /api/issues`

```json
{
  "issues": [
    {
      "id": "2026-09-28",
      "date": "2026-09-28",
      "title": { "en": "St. Michael", "es": "San Miguel" },
      "file": "2026-09-28.pdf",
      "cover": "2026-09-28.svg",
      "sample": true,
      "pdfUrl": "https://…/issues/2026-09-28.pdf",
      "coverUrl": "https://…/issues/2026-09-28.svg"
    }
  ]
}
```

### `GET /api/events`

```json
{
  "events": [
    {
      "id": "potluck-1",
      "date": "2026-11-02",
      "tag": "youth",
      "title": { "en": "…", "es": "…" },
      "place": { "en": "…", "es": "…" },
      "body": { "en": "…", "es": "…" }
    }
  ]
}
```

### `GET /api/about` · `GET /api/youth` · `GET /api/home` · `GET /api/findus` · `GET /api/groups` · `GET /api/games`

Bilingual fields use `{ "en": "", "es": "" }`. Missing `es` should fall back to `en` in clients.

### `GET /api/health`

`{ "ok": true, "service": "ep-newsletter" }`

## Writes (admin)

Header: `x-edit-passphrase: <EDIT_PASSPHRASE>`

- `PUT /api/about|events|groups|youth|findus|home|games|issues`
- `POST /api/upload?kind=uploads|issues|covers` (multipart field `file`)
