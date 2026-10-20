# JobCapture Frontend

Public, read-only job board. React + Vite single-page app.

## Running locally

```bash
npm install
npm run dev
```

`npm run dev` reads `.env.development`, which points at the local backend (`http://localhost:3000`).

## Configuration

Set `VITE_API_BASE_URL` to wherever the [backend](https://github.com/Muhammad-Hammad-Malik/JobCapture-Backend) is running. If unset, production builds fall back to `https://job-capture-backend.vercel.app`. See `.env.example`.

## Build / deploy (Vercel)

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

## Features

- Tech / Non-tech switch, search, and multi-select filters (category, skills with optional match-all, city, work type, experience including "Not specified"), each with live counts. All filters are synced to the URL so filtered views are shareable/bookmarkable.
- Responsive card grid with pagination, loading skeletons, and empty/error states.
- Click-through detail modal with description, contact/apply links, and a link back to the original LinkedIn post (when available).
- Only shows active (`open`, non-cleared) jobs — closing or clearing a job in the admin app removes it from here immediately.
