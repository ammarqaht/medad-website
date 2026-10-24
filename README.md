# مـــــداد · medaad.tech

The Medad website: an Arabic (RTL) static site built with Astro 7 and Preact islands, served by nginx in Docker on CranL.

## Requirements
Node 24 (matches the Dockerfile), npm. Docker is optional (to try the production image).

## Run
```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static output in dist/
npm run preview    # serve dist/ at http://localhost:4321
npm run check      # astro check + scripts/check-dist.mjs on dist/ (copy and confidentiality rules)
```
`npm run check` reads blocked client names from an untracked `.banned-words` file (one per line). Without it that part of the check is skipped, so keep a copy locally before releasing.

## Test
Playwright runs against a fresh build served by `astro preview`. Use a port nobody else is using:
```bash
TEST_PORT=4477 npm test                      # whole suite
TEST_PORT=4477 npx playwright test tests/home.spec.ts
```
Default port is 4400. `reuseExistingServer` is on, so a stale preview on the same port will be reused: pick a new `TEST_PORT` after changing code. nginx headers are checked statically in `tests/deploy-config.spec.ts` (no nginx needed).

## Production image
```bash
docker build -t medad-website .
docker run --rm -e PORT=8080 -p 8080:8080 medad-website   # http://localhost:8080
```

## Deploy (CranL)
CranL builds the public GitHub repo (`ammarqaht/medad-website`, branch `main`) with the `Dockerfile` and injects `$PORT`. Nothing in the app needs environment variables. Full steps, domain setup, verification and rollback are in `docs/RUNBOOK.md`. Short form:
```bash
git push origin main
cranl apps deploy a71cf459-d7b0-452b-b4ed-5cd5311bc46c
cranl apps deployments list a71cf459-d7b0-452b-b4ed-5cd5311bc46c
```

## Structure
- `src/content/`: all copy. `site.ts` (home, header, footer, WhatsApp link, meta), `works.ts` (works registry, folders, work-page copy), `brand.ts` (the brand-word helper that turns `{مداد}` into the kashida form).
- `src/pages/`: `index.astro` (home), `works/index.astro` (archive), `works/[slug].astro` (one page per work, generated from `works.ts`), `404.astro`.
- `src/layouts/BaseLayout.astro`: head, SEO tags, JSON-LD, CSP meta, header/footer.
- `src/components/`: shared (`Header`, `Footer`, `Button`, `InkFlood`), `home/` sections, `works/` (archive, device frame, folder cards, pending sheet).
- `src/islands/<work>/`: one Preact island per live demo, loaded only on that work's page: `halqah`, `nabda`, `tasyeer-tasjeel` (`tasjeel/`), `tasyeer-tahfeez` (`tahfeez/`), `injaz`. Each has its own `store.ts` (in-memory state), views per role, and CSS.
- `src/data/`: invented demo data for the islands. Demos make no network calls and use no storage (guarded by `tests/no-data-leaves.spec.ts`).
- `src/scripts/`: ink-flood transition, motion utilities (12fps steps, stamp-in, Lenis + GSAP), home section scripts (`home/`).
- `src/styles/`: `tokens.css` (palette, fonts), `global.css` (Neo-Brutalism base), `works.css`.
- `public/`: fonts, logos, OG image, `robots.txt`, `boot.js` (runs before first paint).
- `deploy/`: `default.conf.template` (nginx, uses `$PORT`) and `headers.conf` (security headers).
- `scripts/check-dist.mjs`: post-build copy and confidentiality checks.
- `tests/`: Playwright specs (structure, a11y, keyboard, flood, fail-open, deploy config, one per demo).
- `DESIGN.md`: the design system every page follows.

## Adding a demo (pattern)
1. Add the work to `src/content/works.ts` (slug, name, line, frame, `demo: true`) and its folder.
2. Create `src/islands/<name>/` with a root island component and a `store.ts`; put invented data in `src/data/<name>.ts`.
3. Register the island in `src/pages/works/[slug].astro` (import and `LIVE` list).
4. Add a spec in `tests/`, then run `npm run check` and the suite.

## Notes
- `docs/`, `reference/`, `assets/`, `MEDAD.md`, `KICKOFF.md` are gitignored because they can name clients and the repo is public. Release docs that are safe to share (`docs/RUNBOOK.md`, `docs/HANDOVER.md`) must be added with `git add -f`.
- No analytics, no cookies, no backend, no environment variables.
