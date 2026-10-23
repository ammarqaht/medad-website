# CLAUDE.md

Medad (مداد) public website: a detailed Arabic (RTL) introduction page for the studio and its products.
Status: **phase 1 (foundation)**. Stack: Astro 7 static + Preact islands, GSAP + Lenis, nginx on CranL. Plan and scope: `docs/requirements.md` (local only).

## Read first
- `DESIGN.md`: the approved Neo-Brutalism design system. Every UI change must follow it.
- `MEDAD.md`: brand rules (the brand word «مـــــداد», kashida, copy rules, confidentiality) and the product portfolio.
- `KICKOFF.md`: open concept directions and decisions still owed by the owner. Do not build past an open decision.

## Structure
- `assets/fonts/`: Thmanyah Sans (body/UI) and Thmanyah Serif Display (headlines), woff2, weights 300 to 900.
- `assets/logo/`: transparent logo marks (808×267) in each palette color, original logo, favicons.
- `assets/tokens.css`: palette, @font-face (resolves `assets/fonts/`), RTL reset, `.brand-word`.
- `reference/content.js`: current landing copy and the `{مداد}` token helpers.
- `reference/neo-brutalism/`: the approved style page from `style-lab/styles/03-neo-brutalism/`, unchanged. Its
  `../../shared/` paths do not resolve here; open the original in `../style-lab/` to see it live.

## Non-negotiables
- `<html lang="ar" dir="rtl">`, logical CSS properties, no horizontal scroll at 375/768/1440, `prefers-reduced-motion`.
- Only the logo green family and neutrals from `tokens.css`. No other hue.
- No client names, prices, partners or internal tools on the site unless the owner approved it in `KICKOFF.md`.

## Commands
`npm run dev` · `npm run build` · `npm run check` (astro check + `scripts/check-dist.mjs`; client names to block live in the untracked `.banned-words`).

## Repo
Public on GitHub (CranL only builds public repos). `docs/`, `MEDAD.md`, `KICKOFF.md`, `reference/`, `assets/` are gitignored on purpose: they name clients.
