# NewsPulse frontend

Next.js app for the NewsPulse tab feed (topic cluster digests from the Django API).

## Open the correct folder in your editor

Open **`news-pulse-frontend`** (this directory) or the multi-root workspace **`newsmine.code-workspace`** at the repo parent.

Do **not** open these as the workspace root — Source Control will show thousands of bogus “changes”:

- `.next/` or `.next/standalone/` (Next build output after `npm run build`)
- `node_modules/`

Those paths are in `.gitignore` and are regenerated locally.

## Development

```bash
npm install
npm run dev
```

API base URL: `NEXT_PUBLIC_API_URL` (default `http://localhost:8000/api`).

## Production build

`next.config.ts` uses `output: 'standalone'`. `npm run build` creates `.next/` (~1000+ files including source maps). This folder is **not** committed.
