# NexPrepCA frontend

Next.js web app for NexPrepCA (exam current affairs from the Django API).

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

Environment: copy `config/env.dev.example` to `.env.local` (default `NEWSMINE_ENV=dev`).

Use the same hostname as `NEWSMINE_DEV_HOST` in `news-pulse-backend/.env`. Run `../scripts/dev-host.sh` for suggested values (mDNS for phone/LAN).

| Variable | Dev default |
|----------|-------------|
| `NEXT_PUBLIC_NEWSMINE_ENV` | `dev` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api` (or `http://YourMac.local:8000/api`) |
| `ALLOWED_DEV_ORIGINS` | Hostname only, for phone HMR (e.g. `YourMac.local`) |

See `news-pulse-backend/docs/tech-product-notes/environments.md` for backend + Docker setup.

## Production build

`next.config.ts` uses `output: 'standalone'`. `npm run build` creates `.next/` (~1000+ files including source maps). This folder is **not** committed.
