# مـــــداد · medaad.tech

The Medad website: an Arabic (RTL) static site built with Astro, served by nginx.

## Run locally
```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static output in dist/
npm run preview    # serve dist/ at http://localhost:4321
npm run check      # type check + copy/confidentiality checks on dist/
```

## Run the production image
```bash
docker build -t medad-website .
docker run --rm -p 8080:8080 medad-website   # http://localhost:8080
```

## Deploy (CranL)
CranL builds this repository with the `Dockerfile` and sets `$PORT`. Push to `main`, then deploy the app.

## Structure
- `src/content/`: all site copy (`site.ts`) and the brand-word helpers (`brand.ts`).
- `src/layouts/`, `src/components/`, `src/pages/`: Astro pages and components.
- `src/scripts/`: the ink-flood page transition and motion utilities (12fps stepped motion, stamp-in, Lenis + GSAP).
- `src/styles/`: palette and fonts (`tokens.css`) and the Neo-Brutalism base (`global.css`).
- `public/`: fonts, logos, `boot.js` (runs before first paint).
- `deploy/`: nginx config and security headers.
- `DESIGN.md`: the design system every page follows.
