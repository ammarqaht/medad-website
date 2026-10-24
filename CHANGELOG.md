# Changelog

Dates are commit dates. Versions are release milestones (one per build phase); `package.json` still says 0.1.0 and should be bumped when the launch is tagged.

## Unreleased: 1.0.0 launch candidate (phase 6)
### Added
- `docs/RUNBOOK.md` (pre-deploy checklist, CranL deploy, domain, verification, rollback, monitoring) and `docs/HANDOVER.md` (Arabic owner handover).
### Changed
- README rewritten: run, test on an isolated port, build, Docker, deploy, structure with islands and demos.
### Known open items (not blockers)
- Font subsetting, logo as SVG/WebP, per-slug CSS split.
- Mobile LCP of the opener is about 3.0s (target 2.5s); owner decision pending.

## 0.5.1 (2026-10-24): Phase 5 review fixes
### Fixed
- Reviewer findings on the Tasyeer and Injaz demos and the home links (26bea6f).

## 0.5.0 (2026-10-24): Phase 5, Tasyeer and Injaz demos
### Added
- Demos for the Tasyeer registration, Tasyeer motivation and Injaz works, each a Preact island with invented data in `src/data/` (f8b9120).
- Home: clear paths to the works (e6e42d3).
### Changed
- Reveals now trigger later and stagger in reading order, site-wide (d90e35d).
### Fixed
- The brand word now always shows on the ink curtain (448bcf7).

## 0.4.1 (2026-10-24): Security, SEO and Nabda review
### Added
- Security: HSTS header, tighter `.dockerignore`, guard test that demo data never leaves the browser (c96d4dc).
- SEO: sitemap, robots.txt, share (OG) image, Organization JSON-LD (abec89a).
- Nabda engine tests (16e0025).
### Changed
- Nabda review fixes (16e0025). Archive shows a short overview line instead of the long note (4bf2ce0).
- `X-Robots-Tag: noindex` is sent only on `*.cranl.net` preview hosts.

## 0.4.0 (2026-10-24): Phase 4, Nabda demo
### Added
- `/works/nabda`: local live-quiz demo in a phone frame, counters, automatic teams and the three-card store (f1c72ec).

## 0.3.0 (2026-10-23 to 2026-10-24): Phase 3, works archive and Halqah demo
### Added
- Works archive with the two arms and folders, work page template with device frame, Halqah demo island (cb55402).
- Compact phone layout for the Halqah demo and the archive (5c1d8ed).
### Changed
- Malamih listed under live experiences, demo being printed (80b8df6).

## 0.2.0 (2026-10-23 to 2026-10-24): Phase 2, home page
### Added
- Full home page: drop opener, ink-line story, arms scene, works glimpse, closing (77bbfec).
- Opener uses the real logo image revealed drop by drop, no skip button, replays on reload (313b148, 8686995).
- Home test suite; phase-1 specs updated to the owner's decisions (1d381c7).
### Changed
- Quiz as a question card, balanced fork drawn to each card, screens self-move on touch (629eea5, bbe0aec).
- Compact phone layout for the home page (d55f8d9).

## 0.1.0 (2026-10-23): Phase 1, foundation
### Added
- Astro static site with Preact, Arabic RTL base layout, self-hosted Thmanyah fonts (b5938cb).
- Neo-Brutalism base: tokens, box, buttons, header with works link and WhatsApp, footer, 404.
- Ink-flood page transition with reduced-motion fallback; 12fps motion utilities; Lenis + ScrollTrigger.
- Hashed CSP meta, nginx security headers, Docker image for CranL.
- Playwright test suite (8cde763, 8c381e8).
