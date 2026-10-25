# Medad Website: Design System (Neo-Brutalism)

> **Status: APPROVED** (owner picked style 03 Neo-Brutalism from the Style Lab, 2026-10-23).
> Last updated: 2026-10-24 (update mode: documents the built home page, ink effects, works section and demos).
> Source of truth for every page of the Medad website. `design-guardian` checks against this file.
> Origin: `style-lab/styles/03-neo-brutalism/` (copied untouched to `reference/neo-brutalism/`, local only).
> Brand rules (brand word, copy voice, confidentiality) live in `MEDAD.md` and override nothing here; they add to it.
> Where this file says "code", the live source is `src/`. Tokens: `src/styles/tokens.css` (palette, fonts, reset,
> `.brand-word`) and `src/styles/global.css` (style tokens, `.box`, `.btn`, stamp-in, ink writing).
> (`assets/tokens.css` is the original lab copy; the site uses `src/styles/`.)

---

## 1. The idea in one paragraph

Raw, loud, honest. Flat blocks of paper, white and logo green, every block outlined in a **3px ink border** and
casting a **hard 6px ink shadow** with zero blur. Things look like stickers, printed slabs and archive folders
placed on a dotted sheet: slightly rotated, overlapping, unapologetic. Type is huge and black (weight 900).
Motion is **stop-motion**: hard frames at 12 per second, never eased. Things stamp in, snap, and press down into
their own shadow. The ink theme («مداد» = ink) is literal: logo revealed by falling drops, a blot, a pen nib that
writes headings, a page change that floods the screen with ink.

**The five laws** (break one and it stops being this style):
1. Ink border on every surface that holds content (`3px solid var(--ink)`).
2. Shadows are hard offsets only. No blur, ever.
3. Flat fills only. No soft gradients. Allowed "gradients" are hard-stop only: the dot grid, stripe/barcode
   patterns, and the 2-tone slit of the pen nib.
4. Motion uses `steps()` (or a 12fps timer), never `ease` curves. The only eased values are the reduced-motion
   fallbacks (short opacity/colour fades).
5. Weight 700 minimum for body; 900 for every headline, number and button. (Footer small text is 500; see 3.)

---

## 2. Color

Only the logo hue (173.6°) family plus neutrals. No other hue may appear anywhere. Defined in
`src/styles/tokens.css`.

| Token | Hex | Role |
|---|---|---|
| `--paper` | `#F6F4EF` | page background, light buttons on green, phone/demo screen background |
| `--white` | `#FFFFFF` | default `.box` fill (text cards), sheets, demo cards |
| `--gray` | `#E7E6E1` | background dot grid; footer small text; "wrong" state fill; frame title bar |
| `--ink` | `#0C1715` | text, every border, every shadow, dark slabs, footer, the ink blot, flood |
| `--ink-muted` | `#4A5552` | secondary text on light (7:1 on paper); used in demos for meta text |
| `--green-50` ... `--green-200` | `#F1F9F8` `#DEF2F0` `#BCE6E1` | defined ramp, reserved (not used by pages today) |
| `--green-300` | `#85D6CD` | secondary blocks (titles, back control, 2nd chapter card, soft folder), hover of light buttons, pressed chips |
| `--green-400` | `#36C9BA` | neon on ink: footer link, brand word on flood, separators on ink band, `::selection` text, quiz mark, right answer |
| `--green-500` | `#1A8A7D` | **the logo green**: highlight blocks, green band, green folder, closing slab, primary buttons, **shadow of ink-filled blocks** |
| `--green-600` | `#126E64` | small green text on light |
| `--green-700` | `#0D544D` | green status text on paper (quiz message) |
| `--green-800` | `#083A35` | hover of ink buttons/chips/tabs |
| `--green-900`, `--green-950` | `#042421` `#051211` | defined, reserved |
| `--brand` / `--neon` | aliases | `--green-500` / `--green-400` |

Contrast rules (WCAG AA, measured):
- Ink on `--green-500` = 4.33: text on green blocks must be **19px+ bold** (all our green-block text is 900 and
  large). Never small text on green-500.
- `--green-500` as **text** on paper = 3.84: large text and graphics only. Small green text uses `--green-600`
  or `--green-700`.
- On ink, readable green is `--green-400` (8.9). Paper on ink = 16.6.

Surface recipes:
- Light card: `--white` + ink border + ink shadow (`.box`).
- Green slab: `--green-500` + ink border + ink shadow (double offset 12px for the biggest slab).
- Soft block: `--green-300` + ink border + ink shadow.
- **Ink block** (dark card, ink tab, phone body, nav button, chip, quiz arm): `--ink` fill, `--paper` text,
  **`--green-500` shadow** (`var(--sx) var(--off) 0 0 var(--green-500)`).
- Dark band / footer: `--ink` background, `--paper` text, `--green-400` accents.

Page background:
```css
body {
  background-color: var(--paper);
  background-image: radial-gradient(var(--gray) 1.6px, transparent 1.7px); /* hard dot grid */
  background-size: 26px 26px;
}
::selection { background: var(--ink); color: var(--green-400); }
```

---

## 3. Typography

Fonts (self-hosted woff2 in `public/fonts/`, `font-display: swap`, weights 300 to 900; the two preloaded files are
Serif Display Black and Sans Bold): **Thmanyah Serif Display** (`--font-display`, headlines, numerals, brand word)
and **Thmanyah Sans** (`--font-body`, body and UI).

| Role | Family | Weight | Size (clamp) | Line height |
|---|---|---|---|---|
| Works gallery title | Display | 900 | `clamp(56px, 9.4vw, 140px)` (48px under 600) | 1.12 |
| Closing headline (home) | Display | 900 | `clamp(46px, 8.2vw, 124px)` | 1.12 |
| Work page title / closing | Display | 900 | `clamp(56px, 8vw, 120px)` / `clamp(42px, 6.4vw, 96px)` (44px / 38px under 600) | 1.12 |
| Home hero headline | Display | 900 | `clamp(44px, 7.2vw, 112px)` | 1.12 |
| Section title (H2: meaning, glimpse, arms) | Display | 900 | `clamp(40px, 6vw, 88px)`; arms `clamp(40px, 6.4vw, 96px)` | 1.15 |
| Shelf title | Display | 900 | `clamp(36px, 4.6vw, 64px)` (32px under 600) | 1.2 |
| Chapter title | Display | 900 | `clamp(32px, 4.4vw, 64px)` | 1.2 |
| Card title (arm, file, sheet, tab) | Display | 900 | arm `clamp(34px, 4vw, 56px)`, file `clamp(36px, 3.6vw, 52px)`, sheet `clamp(28px, 3vw, 40px)`, folder tab `clamp(28px, 3.2vw, 40px)` | 1.2 |
| Band (green) | Display | 900 | `clamp(34px, 5.6vw, 84px)` | 1.25 |
| Band (ink) | Sans | 900 | `clamp(26px, 3.8vw, 56px)` | 1.25 |
| Lead text | Sans | 700 | `clamp(21px, 2.3vw, 32px)` (works: up to 30px) | 1.6 |
| Body | Sans | 700 | `clamp(19px, 1.6vw, 24px)` | 1.6 |
| Buttons / chips / nav | Sans | 900 | lg `clamp(20px, 2.2vw, 26px)`, nav and sheet-open 16 to 17px, chip 18px (16px phone) | 1 |
| Quiz question | Display | 900 | `clamp(24px, 2.6vw, 34px)` | 1.3 |
| Numerals (chapter stamps) | Display | 900 | 56px (88px box) desktop, 40px (64px box) mobile | 1 |
| Footer | Sans | 500 | 15 to 18px | 1.7 |
| **Demo UI (inside the device frame)** | Sans | 700 / 900 | base 15 to 16px, **nothing under 14px** | 1.45 |

Rules:
- Page text is never under 16px; **demo text is never under 14px** (a phone-width demo uses 14px for meta text only).
- `letter-spacing: 0` on all Arabic. Never letter-space Arabic.
- `text-wrap: balance` on big headlines.
- No diacritics in display copy (tight line height makes harakat collide with the next line).
- Numbers are **Arabic-Indic** (١ ٢ ٣) in display copy and in the demos. **Zero is the exception**: see 8
  (Arabic dot hazard).
- Kashida: one optional accent word per page in display text, max two tatweels, after a connecting letter. The
  brand word is the exception (see `MEDAD.md`): always `.brand-word` (Display Black, no letter-spacing,
  `white-space: nowrap`).

---

## 4. Core tokens of the style

```css
:root {
  --bw: 3px;                     /* border width */
  --off: 6px;                    /* shadow offset */
  --sx: calc(var(--off) * -1);   /* RTL: shadow falls to the LEFT and down */
  --shadow: var(--sx) var(--off) 0 0 var(--ink);
  --snap: 90ms steps(2, jump-end);    /* hovers, presses, rotations (about 1 frame at 12fps) */
  --stamp: 240ms steps(3, jump-end);  /* entrance stamp (3 frames) */
  --gutter: clamp(16px, 4.5vw, 64px);
  --max: 1320px;
}
```

RTL rule for shadows: light comes from the top right, so shadows fall to the **inline end (left) and down**:
`box-shadow: -6px 6px 0 0 var(--ink)`. Every shadow, hover translate and press translate follows this direction.

Demo-scale shadows (derived, so a demo is not heavier than the page): Halqah `--hq-off` = 0.66 x `--off` and
`--hq-off-s` = 0.5 x `--off`; Nabda `--nb-off` = 0.6 x `--off`. Same direction, same hard rule.

Radius: **0** everywhere. The only round things are the canvas ink blot and drops, the ring sticker and the drop
icon. (The "device dots" and switches are squares.)

Spacing (observed, not a strict scale): gaps and paddings are 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48px
plus `clamp()` for section rhythm. Section vertical padding `clamp(32px, 6vw, 80px)` to `clamp(56px, 8vw, 120px)`.
Minimum touch target **44px** (chips 48px on desktop, 44px on phones).

---

## 5. Components

### 5.1 `.box`, the base block (`global.css`)
`border: var(--bw) solid var(--ink); box-shadow: var(--shadow); background: var(--white);`
Every card, panel, text slab and title block is a `.box` with a different fill.

### 5.2 Button (`src/components/Button.astro`, styles in `global.css`)
- Props: `href`, `variant` = `lg` (default) | `sm` | `paper`. External `http(s)` links open in a new tab with
  `rel="noopener noreferrer"`.
- Fill `--green-500`, ink text 900, ink border, hard shadow, a blunt CSS arrow (`::after` clip-path) pointing in
  the reading direction (left).
- **Hover:** moves half way into its shadow (`translate: -3px 3px`, shadow 3px), arrow nudges 4px.
- **Active / keyboard Enter or Space:** fully pressed (`translate: -6px 6px`, shadow 0). `motion/press.ts` adds
  `.is-pressed` on keydown.
- `.btn--sm`: ink fill, paper text, green shadow, no arrow. `.btn--paper` (also gets `.btn--lg`): white fill for
  green slabs, hover `--green-300`.
- Min height 44px. Transition `translate/box-shadow/background-color` at `--snap`.

### 5.3 Header (`src/components/Header.astro`)
Sticky, paper background, 3px ink bottom rule, z-index 50. Logo image (`/logo/medad-mark-ink.png`, 88 to 128px
wide) at the start. **No WhatsApp or contact in the header** (contact is only in the closing slab, the work-page
closing and the footer). The end side holds exactly one control:
- Outside `/works`: **works link**: ink tab, paper text 900 17px, green shadow, hover `--green-800` half press.
- Inside `/works` and `/works/*`: a **back control** (green-300 slip, ink border, hard shadow, `rotate: -1.5deg`,
  arrow pointing right = back in RTL). It is named after where it returns to: «العودة للرئيسية» or «العودة
  للأعمال». `initBack()` (`transition.ts`) renames it from the referrer and, when the visitor came from this
  site, returns through history so the previous page keeps its scroll; from elsewhere it follows its own `href`
  (`/works` from a work page, `/` from the archive).

### 5.4 Footer (`Footer.astro`)
Ink background, paper logo (`medad-mark-paper.png`, 120px), one line, a **WhatsApp link** in `--green-400` with a
3px underline that inverts on hover (green fill, ink text), copyright in `--gray` (15px). Grid of four on 900px+.

### 5.5 Home page (`src/pages/index.astro`, parts in `src/components/home/`)
Order, one idea per screen: **Hero (opener) > Bands > Meaning > Story > Arms > Glimpse > Closing**. Each part
below; motion details in 7.

- **Hero** (`Hero.astro` + `scripts/home/opener.ts`): a stage (`4/3`, `2.3/1` from 600px, max 860px) holding a
  `<canvas>` and the logo as **two images** (`medad-mark-ink.webp` and `medad-mark-paper.webp`, never text),
  54% of the stage. **Opener:** one ink drop falls to the centre and spreads, in 12fps steps, into a blot; the
  logo is paper from the start, so it emerges in white as the ink reaches around it (it never turns from black
  to white). The green shadow lands and short impact strokes fly out once the blot is full; no dots or circles
  remain. No skip button: any scroll, touch, key or tap on the stage ends it. It replays on every reload. Under it: the H1 (last word boxed in green: `.hl`, ink border, shadow, `rotate: -2deg`, done
  by wrapping the last whole word), a white `.box` supporting line (`rotate: .6deg`, max 46ch), and a "scroll"
  cue linking to `#story` (blunt down arrow, 2-step nudge). End state: a wobbly ink blot with a **hard green
  shadow** (green-500 blot offset left-down behind the ink blot), the paper logo on it. Without canvas: a flat ink
  slab with a green shadow stands in.
- **Bands** (`Bands.astro`): signature crossing tape. Green band (`rotate: -3deg`, display font, brand copy) over
  an ink band (`rotate: 2deg`, sans, short service words), 5-point clip-path star separators (ink on green,
  green-400 on ink). `aria-hidden` (decoration only). Behaviour in 7.
- **Meaning** (`Meaning.astro`): green-300 title box (`rotate: -2deg`, `data-pop`) overlapping a large white
  entry box (12-col grid, title cols 1 to 6, entry cols 4 to 12 with `-36px` overlap), an ink drop icon on the
  corner. The title is **not** ink-written (it stamps).
- **Story** (`Story.astro` + `scripts/home/story.ts`): one 6px ink line (SVG, square caps) runs through three
  **chapter cards** (white, green-300, green-500; slight rotations; zigzag columns on 900px+). Each chapter has a
  **numbered stamp** (Arabic-Indic numeral in a paper square with border and shadow; 88px desktop, 64px mobile)
  that turns `--green-500` when the line reaches it (`.is-hit`). Chapter titles are ink-written. Each card holds
  a flat illustration (chat bubble / browser frame / switch + bars) drawn in hard frames after the card lands;
  **illustrations are hidden under 600px**.
- **Arms: «ماذا نكتب؟»** (`Arms.astro` + `scripts/home/arms.ts`): ink-written title, a 6px ink **fork** (two SVG
  paths from the title to each card, drawn in 7 steps, 900px+ only), two cards:
  - Digital (white `.box`, `rotate: -1deg`): three **interactive screens** (site / system / platform
    mini-screens, `<button aria-pressed>`), one open at a time (open = wider, taller, green-300, draws its UI
    frame by frame). They cycle every 2.4s while on screen until the visitor hovers (mouse), taps or focuses
    them (then the cycle stops for good; WCAG 2.2.2).
  - Live (ink card, green shadow, `rotate: .8deg`): a paper **question card** (`.quiz`, `rotate: -1.2deg`) with a
    green-400 "؟" square stuck on its corner, a one-question quiz with three option buttons that nudge in turn
    until answered; right answer stamps green-400 and locks, wrong shakes and resets; message in an
    `aria-live="polite"` line (green-700 text).
  - The cards hold no links into the archive (owner: only two ways into the works, see 5.14).
  - No product or system names in this section.
- **Glimpse «من أعمالنا»** (`Glimpse.astro`): three **desktop-style folders** in a row on every screen (white,
  green-500, green-300): a back panel with a tab on the start side (right in RTL, slanted on its inner side), a
  sheet of paper peeking out that sways ±2.5deg in hard steps (each folder out of step), and a front panel with a
  hard lip line; ink borders, hard shadow. The work's name sits under its folder with an arrow, like a desktop
  icon label. Hover/focus: the folder lifts 6px and the paper rises out. No descriptions, no caption. A
  `.btn--paper` «كل الأعمال» opens the archive.
- **Closing** (`Closing.astro`): green-500 slab with a 12px double shadow, ink-written headline (max 11ch),
  one line, a paper WhatsApp button, and a ring sticker (paper ring, ink centre) on the corner that turns on
  hover. This is the only call to contact on the home page.

### 5.14 Ways into the works, and what looks clickable (owner decisions, 2026-10-25)
- Exactly **two** ways into the works from the home page: the header link «أعمالنا» and the «كل الأعمال» button
  after «من أعمالنا». No hero button, no floating button, no archive links in «ماذا نكتب؟».
- Anything clickable carries a cue: buttons and the header link have the blunt arrow; filter chips have a
  triangle that turns down when selected; folder labels have an arrow. Decorative boxes never carry one.
- Every WhatsApp link opens the chat with a pre-filled message (`waLink()` in `src/content/site.ts`): a general
  one on the home closing and the footer, one naming the work on a work page.

### 5.6 Ink flood: page transition (`InkFlood.astro` + `scripts/transition.ts` + `public/boot.js`)
A fixed full-screen ink layer (`z-index: 1000`) with the brand word (green-400, `.brand-word`) in the middle.
- **Cover** (420ms, `steps(5)`): `clip-path: circle()` grows from the click point (screen centre for keyboard
  activation) to cover the screen; the word stamps in on the 4th frame.
- **Hold:** the next page opens still covered (boot.js sets `html[data-flood]` before first paint, which hides
  everything but the flood). The word stays until **600ms after the new page starts** (`performance.now()` clock,
  fixed, not tied to load speed).
- **Drain** (420ms, `steps(5)`): ink falls away from the top (`inset(100% 0 0 0)`). Total about 1.4s.
- Applies to every same-origin page link. Skipped for: modified clicks, `target`, `download`, `data-no-flood`,
  `rel=external`, file links (`.pdf`, `.png`...), same-page links, and reduced motion (plain navigation; the
  flood is `display: none`).
- Back control uses `history.back()` after the cover when the visitor came from the site.
- Fail-open: timers lift the cover (boot 2.5s, stuck navigation 4s). bfcache restores (`pageshow`) are handled.

### 5.7 Ink writing: key headings (`motion/inkwrite.ts` + `global.css`, attribute `data-ink`)
Used on: home arms/glimpse/closing titles, chapter titles, folder tabs, work titles, work closing title, the
pending-sheet title. Not on the hero, meaning title or the works gallery title.
- **One pen:** headings are written one at a time, in the order they reach the reveal line (reading order within
  a group); nothing is written until the ink curtain has drained (`motion/uncovered.ts`).
- When the heading's parent passes the reveal line (`REVEAL_MARGIN`, 22% above the bottom), the heading is split into its
  **rendered lines (whole words only)**. Each line is written **right to left** in turn (clip-path inset
  animation, `steps(frames(seconds))`) behind a **pen nib** riding the writing edge.
- **The ink is its final colour from the first stroke** (no recolouring at the end).
- Time per line = 0.04s x characters, clamped 0.4 to 1.1s, rounded to 12fps frames, 0.1s between lines.
- Nib: 0.26em x 0.9em ink shape with a hard paper slit, tilted -28deg, positioned with a **physical `left`** on
  purpose (it travels leftwards in RTL), hidden at the end.
- When the last line is done the plain text is put back (`textContent = original`) so it reflows on resize.
- Without JS the heading is simply visible. Reduced motion: heading fades in (0.5s). Print: shown.
- Safety: any error restores the text; an 8s net reveals visible headings that were missed.

### 5.8 Works archive (`/works`, `src/pages/works/index.astro`, `components/works/`, `styles/works.css`)
- **Head:** huge title with a green highlighted word (`.gal__hl`), a white `.box` line, and on 1000px+ a striped
  "barcode tape" sticker. Title is not ink-written.
- **Filter chips** (`.chip`, buttons with `aria-pressed`): one per arm plus "all". Ink chip, paper text, green
  shadow; **pressed = green-300, translated into its shadow**. Pressing the active arm returns to all. State is
  in the URL (`?arm=digital|live`, `history.replaceState`) and announced in a status line. The bar is `hidden`
  until JS runs.
- **Shelves** (`.shelf`, one per arm, ink rule between): sticky head (rotated green-300 / green-500 title + a
  small box line) in cols 1 to 4 on 960px+, folder stack in cols 5 to 12. A shelf that reappears after
  filtering re-stamps (`shelf-stamp`).
- **Folders** (`FolderCard.astro`, data in `content/works.ts`): `.fold` with a tab carrying the folder name
  (ink-written) at an offset (`--tab` 0 / 24% / 48%), fill = `white | soft (green-300) | green (green-500) | ink`
  (ink folder = paper text, green shadow), slight alternating rotation, `-12px` overlap (`-8px` on phones).
  **One folder per family**: «تسيير» holds two sheets (التسجيل، التحفيز); other folders hold one. A name stands
  alone: no category word next to a name, no name repeated.
- **Sheets** (`.sheet`, links to `/works/<slug>`): white paper in the folder with a **sketch** (`Sketch.astro`: flat
  miniature screen, 16:9, kinds `rows | form | ledger | board | pulse | faces`), the line, and an ink "open"
  button-look with arrow. Hover half-presses and the sketch paper peeks up 6px; the pulse sketch draws in steps.
  On touch (`hover: none`) sheets peek and the arrow nudges by themselves once their folder has landed.
- **Pull:** choosing a sheet pulls it out of its folder (500ms, 6 steps; other folders sink 8px), then
  `archive.ts` re-dispatches the click so the ink flood carries the visitor. One pull at a time; reduced motion
  or modified clicks skip the pull; bfcache restore puts the sheet away.
- **Phone (under 600px):** tighter; each sheet becomes a row: 76px square sketch on the start, name beside it,
  line and open button full width below; sketch details trimmed (rows 4+ hidden).

### 5.9 Work page (`/works/[slug]`, `src/pages/works/[slug].astro`)
Header: rotated green-300 title `.box` (ink-written, `rotate: -2deg`) overlapping a white line `.box`
(`rotate: .6deg`; live demos add a "how to try it" sentence under a 3px rule). Then the **demo section**, then a
**closing slab** (green-500, 12px double shadow, ink-written headline, paper WhatsApp button, and a link back to
the archive). Live demos today: `halqah`, `nabda`, `tasyeer-tasjeel` (Preact islands, `client:visible`). The
others (`tasyeer-tahfeez`, `injaz`, `malamih`) show the pending sheet. (A `tahfeez` island exists in
`src/islands/tahfeez/` but is not wired to a page.)

### 5.10 Device frame (`components/works/DeviceFrame.astro`)
Flat, no perspective, ink border, hard shadow. Props: `kind` = `browser | phone`, `adaptive`, `scroll`, `label`.
- **Browser:** 3px title bar with three **square** dots (green-300 / white / ink) and an address bar block.
- **Phone:** ink body (10px side padding), centred speaker slot (paper bar), screen with a 3px **paper** border,
  max 420px wide, shadow in **green-500**.
- **`adaptive`:** a browser on wide screens, turns into the phone frame under 640px (so a demo never sits in a
  tiny browser).
- **`scroll`:** fixed-height scrolling screen (browser `clamp(560px, 80dvh, 860px)`, phone `clamp(520px, 76dvh,
  760px)`), vertical scroll only, focusable `role="region"` with `aria-label`, focus ring inset.
- Demos size themselves from the frame with **container queries** (`container-type: inline-size`), not viewport
  media queries: phone rules apply at frame width under 560px, so they also apply in the browser frame on a
  narrow window.

### 5.11 Pending sheet (`components/works/DemoPending.astro`)
Shown inside the device frame for works without a demo: a printer slot (ink bar) from which a white paper with
the work's sketch prints out in stepped frames (3.2s loop, `steps(1, end)`), the title **«قيد الطباعة»**
(ink-written), one short line, and a button back to the archive. **Makes no claims** about dates or features. Phone
works use `pend--phone` (smaller title).

### 5.12 Demo UIs (`src/islands/*`; copy and fake data in `src/data/*.ts`)
Each demo is a self-contained Preact island with its own CSS, scoped by a root class (`.hq`, `.nb`, `.ts`), mock
data only (no network, state in `store.ts` / `engine.ts`), same palette, borders, hard shadows and stepped motion
as the site. Demo Arabic numerals via `ar()`.
- **Halqah** (`islands/halqah/`): role switcher (supervisor, teacher, student), rails/tabs, circle cards, day
  strip, attendance radios, line steppers, a points balance (ink block), moves list, accordions (square plus/
  minus). Starts as supervisor.
- **Nabda** (`islands/nabda/`): phone-first live quiz: round bar, three pulse tracks that move in 12fps steps
  (drawn by the island), a short question, three answers, results ranking, shop, cards. The whole round fits one
  phone screen without scrolling. Starts in the phone frame.
- **Tasjeel** (`islands/tasjeel/`): a registration form and its store; follows the same rules.
- **Common rules:**
  - Text **never under 14px**; targets **at least 44px** on phone widths; body 15 to 16px.
  - **Zero is drawn as an empty square outline** (`.hq-zero`, `.nb-zero`, `.tf-zero`: a bordered box in
    `currentColor`, `role="img" aria-label="صفر"`), never as the Arabic-Indic zero «٠» (a lone dot that reads as
    a stray letter dot). "Not recorded / not yet" cells use the same square in `--ink-muted`.
  - **Phone compaction** (container width under 560px): long labels swap for short ones (`.hq-long` /
    `.hq-short`); lists are clipped (first 2, 3 or 6 items) with a **"show all" toggle**
    (`aria-expanded`, 44px, white, bordered) that appears on phone widths only; paddings and gaps shrink (cards 12px,
    gaps 4 to 12px); grids tighten (day strip 5 columns, tally 4, lines 3); headings 19 to 22px.
  - Pressed state = translated into the shadow; reduced motion removes translate and keeps colour change.

### 5.13 Stickers (decor vocabulary)
16-point star, 5-point star separators, ring, striped barcode block, drop icon, folder tab, "؟" square. Always
ink-stroked, flat fills, rotated, placed on corners and edges, never over Arabic text (see 8).

---

## 6. Layout and breakpoints

- Container `max-inline-size: 1320px` (`.wrap`, home sections), side gutter `clamp(16px, 4.5vw, 64px)`.
- Breakpoints actually used: **600px** (`max-width: 599px` = phone: tighter spacing, hidden illustrations, stacked
  files, row sheets), **640px** (adaptive device frame becomes a phone), **900px** (home two-column and 12-column
  asymmetry, footer row), **960px** (archive shelves and work header grids), **1000px** (gallery tape). Demos use
  container queries (560px, 640px, 420px) instead.
- Mobile first. No horizontal scroll at 375, 768, 1440: `overflow-x: clip` on `body`, `main`, `.bands`; rotated
  bands and stickers must never cause scroll.
- Asymmetry is the point: offset cards, overlapping title boxes over text boxes, rotate 1 to 3 degrees. Keep
  rotations on text-heavy boxes under 1deg.
- Logical properties only (`inset-inline-start`, `margin-inline`, `padding-block`, `inline-size`). Physical
  `left`/`right` only where direction is physical on purpose (the pen nib; clip-path insets; the story/fork SVG
  coordinates).
- `100svh` / `100dvh` for full-screen heights (hero `min-block-size: calc(100svh - 70px)`).
- Skip link to `#content`; `main` is `tabindex="-1"`.

### Phone rules (under 600px, summary)
Tighter padding (`24 to 40px` section tops), smaller titles (works 44 to 48px), chapter illustrations hidden,
archive sheets as compact rows, files overlap stacked, filter chips 44px with 16px text, device frames switch to
the phone body, demos clip lists and use short labels. Text never under 14px (demos) / 16px (pages) and targets
never under 44px, even when compacting.

---

## 7. Motion

### 7.1 Principle: stop-motion at 12 frames per second
All element motion is in **hard frames**. `src/scripts/motion/steps.ts` is the single source: `FPS = 12`,
`frames(seconds)` (min 1), `stepEase(seconds)` for GSAP, `stepCss(seconds)` for CSS. CSS uses
`steps(n, jump-end)` (or `jump-none` for ping-pong loops); paired keyframe stops make hard frames
(`0%, 79.9% {} 80% {}`). `--snap` (90ms, 2 steps) and `--stamp` (240ms, 3 steps) are the standard timings.
`ease` is used only in reduced-motion fallbacks.

Known exceptions (documented, not to be copied): the marquee bands move by whole pixels per animation frame
(smooth rate, pixel-snapped); native/Lenis scrolling is not stepped. The `gsap`, `lenis` modules and
`motion/scroll.ts` are installed but **not used by any page today**; do not introduce them without a reason.

### 7.2 Catalogue

| Moment | Spec |
|---|---|
| Entrance stamp | `[data-pop]`: hidden (`opacity 0`, `scale: 1.14`) then stamps to `scale: 1` with `--stamp`. `data-pop="0.1"` staggers by seconds. IntersectionObserver threshold .15, `rootMargin -6%`. After landing `--d` resets to 0 so hovers snap instantly. Hidden only when `html.js` is set. |
| Hover / press | `--snap` on translate, shadow, rotate, colour. Half press on hover, full on active. |
| Ink opener (home) | 12fps, canvas. 5 drops fall (5 frames each, 3 frames apart) right to left, each splashes and reveals its part of the logo image (`--dyed` clip). Then the **blot bursts** (7 spread frames), a **hard green shadow** appears, **5 straight impact strokes** (square caps, ink) fly out and vanish, the logo turns to the paper image and is stamped down (`slam`), and the headline stamps in word by word (170ms apart), then the line and cue. End state: clean blot, nothing around it. Max about 4.7s plus flood wait. |
| Opener rules | Plays on a first visit and on every reload of `/`, not when returning to `/` from another page. Text is in the HTML from the start. **No skip button**: any scroll, touch, key or tap on the stage skips to the end. Reduced motion or no canvas: final state at once. Canvas bleeds 7% past the stage so splatter is never cut. The blot shape is seeded (identical every time). |
| Marquee bands | rAF, whole-pixel steps, units cloned to fill. Green band moves right, ink band against it. **Scroll boosts speed, scrolling up reverses.** Paused off screen. Reduced motion: static. |
| Story line | Path built through the stamps; progress quantised to **72 steps**, tied to scroll, reversible. Stamps light when reached. Reduced motion: fully drawn, all lit. |
| Fork, forms of drawing | Fork 600ms `steps(7)`; chapter illustrations and screen UIs `steps(4 to 6)` with 300ms delays; all clip-path inset reveals from the start side. |
| Arms screens / quiz | Screens cycle every 2.4s (stops at first interaction); quiz options nudge `steps(2, jump-none)` until answered; right = stamp, wrong = 6-step shake. |
| Touch "alive" cues | `@media (hover: none)`: arrows poke, files lift, sheets peek by themselves (since there is no hover). |
| Ink writing | See 5.7. 12fps, whole words, right to left, nib on the edge. |
| Ink flood | See 5.6. Cover 420ms, hold to 600ms after load, drain 420ms. |
| Archive | Filter re-stamp (240ms), sheet pull (500ms, 6 steps). |
| Pending sheet / pulse | `steps(1, end)` loops (3.2s print; 1.2s pulse). |

### 7.3 Reduced motion (`prefers-reduced-motion: reduce`)
Every effect has a fallback; nothing is lost, only movement: stamps become a 0.5s opacity fade, hover/press use
colour/outline instead of translate, ink writing becomes a fade, the opener and flood do not run, bands/story/
fork/drawings are final, touch cues are off, the page itself fades in (0.3s). Demos drop transitions.

### 7.4 Fail-open boot (`public/boot.js`)
Runs sync in `<head>`: adds `html.js` (stamps/ink headings start hidden only then), `html.opening`, `html[data-flood]`.
Each held state has a timer that lifts it if the page scripts never take over (js 3s, flood 2.5s, opener 5s);
`base.ts` and each init cancel their timer and an 8s safety net reveals anything missed. Each init is isolated in
try/catch so one failure cannot block the others. A reload resets scroll to the top so every effect replays.

---

## 8. Hard rules and hazards (learned)

- **Arabic dot hazard:** no small dark dots, stars or beads next to or over Arabic text; they read as letter dots
  (a bead above «تعمل» read as «تغمل»). Stickers live on corners and edges, away from words. Around the opener
  blot there are **no dots or circles** (only straight impact strokes). The Arabic-Indic **zero** is a lone dot, so
  in the demos zero is drawn as an empty square (5.12). Never put a visible "٠" in a table or counter.
  The rule covers zeros **inside** numbers too (١٠ or ١٢٠٤ show a dot between digits): demo data uses zero-free
  values, and computed values draw every zero digit as the square.
- **Never split Arabic words into per-letter spans** (breaks joining). Animate whole words or whole lines only
  (ink writing splits by word and measures lines by `offsetTop`; the hero stamps words).
- **A fully clipped element never intersects an observer.** Ink headings are hidden with `clip-path`, so the
  observer watches the heading's **parent**.
- The brand word is one unbreakable unit (`.brand-word`); in the opener it is the **logo image**, not text.
- The nib uses a physical `left` because Arabic is written right to left (the edge travels leftwards); logical
  properties here would flip it.
- Hold states must **fail open** (7.4). Never leave content hidden if JS, canvas or storage fails; `sessionStorage`
  access is always in try/catch.
- Transitions must not depend on load speed: flood hold is a fixed time from navigation start.
- bfcache: handle `pageshow` (`persisted`) for anything that mutates state before navigating (flood, archive pull).
- Interaction that auto-plays (screens cycle) must stop on the visitor's first hover, tap or focus.
- No blur, no `backdrop-filter`, no soft shadows, no soft gradients, no rounded corners, no pastel softness, no
  photos with soft edges (screenshots go in a `.box` / device frame with ink border and hard shadow).
- No emojis, no English in visible text (except links), no captions, eyebrow labels, badges or category words next
  to a work name. Copy rules: `MEDAD.md`. Do not name clients, products' internals or give numbers about Medad.
- Focus: `outline: 3px solid var(--ink); outline-offset: 4px` (green-400 on ink surfaces; inset -6px for the
  scrolling screen).
- No horizontal scroll at 375, 768, 1440.
- Content security: pages ship a CSP `<meta>` with hashes (Astro `security.csp`); do not add inline styles/scripts
  without going through Astro's build, and no third-party scripts, fonts or images.

---

## 9. Extending the style (for new pages and works)

New components must be derived from the vocabulary above.
- **Work / product card:** a sheet in a folder (5.8) filled from the allowed set only (white / green-300 /
  green-500 / ink), never in the product's own brand colour. Name 900, one line.
- **Browser / phone frame for screenshots or demos:** `DeviceFrame` (5.10), nothing else.
- **Stats / numbers:** the outlined giant numeral style:
  ```css
  color: var(--paper); -webkit-text-stroke: 3px var(--ink); paint-order: stroke fill;
  text-shadow: -4.8px 4.8px 0 var(--ink);
  ```
  or the numbered **stamp** (5.5 Story). Remember the zero rule.
- **Timeline / story:** the ink line + stamps pattern.
- **Tabs / filters:** `.chip` (active = pressed state, no shadow, translated).
- **Forms:** inputs = white box, 3px ink border, no radius, min height 44px, focus = green-300 fill + hard shadow.
- **Accordion (FAQ):** stacked boxes; open one gets the green-500 fill; toggle icon is a square plus/minus.
- **Dark sections:** ink background, white/green boxes keep ink borders but use **green-500 shadows**.
- **New key headings:** add `data-ink` (once per heading, on the element whose text is plain); do not nest
  other elements inside it.
- **New demo:** a Preact island with scoped root class, container queries, 14px text floor, square zero, compact
  phone rules and a show-all toggle for long lists.

---

## 10. Icons and imagery

- Logo: transparent PNG marks in `public/logo/` (`medad-mark-ink`, `-paper`, `-green`, 808x267), favicons and
  apple-touch icon. No other imagery: no photos, no stock, no emoji.
- All icons are CSS: blunt arrow (`clip-path`), 5-point star, 16-point star, ring, square dots, square plus/minus,
  pen nib, drop. Flat, ink or currentColor, no strokes thinner than 2px.
- Illustrations are flat boxes and bars (chapter cards, sketches, screens); decorative ones are `aria-hidden`.

---

## 11. Accessibility rules

- `<html lang="ar" dir="rtl">`; one `<h1>` per page; headings in order.
- Contrast per section 2; small text never on green-500.
- Targets at least 44px; text at least 16px on pages, 14px in demos.
- Visible focus on everything; skip link; scrolling demo screens are focusable regions with names.
- Decorative layers (`bands`, canvas, nib, flood, fork, illustrations, ring) are `aria-hidden`. The hero logo has
  `role="img"` with the brand name as label.
- Auto-playing content stops on interaction (screens); nothing flashes more than 3 times a second (12fps stepped
  motion only moves shapes, never full-screen strobes; the flood is a single cover and drain).
- Live regions for state changes (quiz message, filter status).
- Reduced motion honoured everywhere (7.3). Tests: `tests/*.spec.ts` (Playwright + axe).

---

## 12. Architecture constraints

- Stack: Astro 7 static + Preact islands (`client:visible`). Approved libraries: `astro`, `@astrojs/preact`,
  `preact`. Installed but unused: `gsap`, `lenis` (do not use without approval). No UI kit, no CSS framework.
- Folders: `src/pages` (routes), `src/layouts/BaseLayout.astro`, `src/components` (shared: `Header`, `Footer`,
  `Button`, `InkFlood`), `src/components/home/*` (home sections), `src/components/works/*` (archive, frame,
  pending, sketch, `archive.ts`), `src/islands/<demo>/` (Preact demo + its CSS + store), `src/data/*` (mock demo
  data), `src/content/*` (`site.ts`, `works.ts`, `brand.ts`: all copy), `src/styles/*` (`tokens.css`,
  `global.css`, `works.css` loaded only by `/works` pages), `src/scripts/*` (`base.ts`, `transition.ts`, `home/*`,
  `motion/*`), `public/` (fonts, logo, `boot.js`).
- Styling: plain CSS with the tokens above; Astro scoped `<style>` for components; BEM-like class names
  (`block__element--modifier`); demos prefix their classes (`hq-`, `nb-`, `ts-`, `tf-`). Logical properties only.
- Copy lives in `src/content/*`, never hard-coded in components; the brand word goes through `html()` / `text()`
  helpers in `brand.ts`.
- Per-page scripts are imported by the component that needs them; shared motion is in `src/scripts/motion/`.
- Colour values are tokens; no raw hex in components except the canvas fallbacks in `opener.ts` (read from CSS
  variables first) and `theme-color` meta.
- Check before shipping: `npm run check` (astro check + dist checks) and `npm test`.

---

## 13. Inconsistencies found (values to migrate)

Low severity; the system is consistent. Recorded so nobody copies them:
1. `src/components/home/Arms.astro:~167-168`: `.quiz__opt` declares `box-shadow` twice (green-500, then ink); the
   second wins. Remove the first.
2. Display sizes for H2 vary by section (`6vw` meaning/glimpse, `6.4vw` arms, `4.6vw` shelf). Intentional
   hierarchy, but if a new section is added use the 6vw size.
3. `Footer.astro` and `Closing.astro` use WhatsApp (not email): the earlier version of this file said email.
4. Spacing is not a strict 4/8 scale (6, 10, 14, 18px appear in demos and cards). Acceptable inside demos; new
   page-level spacing should use 4/8 multiples or `clamp()` rhythm.
5. Unused tokens: `--green-50..200`, `--green-900`, `--green-950`, `--brand`, `--neon`.
6. Unused dependencies/modules: `gsap`, `lenis`, `src/scripts/motion/scroll.ts`; `src/islands/tahfeez/` not wired.
7. Marquee bands animate at display refresh (pixel-snapped), not at 12fps (see 7.1).

---

## 14. Change log

- 2026-10-25: Update. Opener is one drop spreading with the logo emerging in white; reveals start at the reveal
  line (22% above the bottom) in reading order and only after the curtain drains; one pen for all ink-written
  headings; «من أعمالنا» as desktop folders with swaying paper; two ways into the works only; click cues (arrows,
  chip triangles); pre-filled WhatsApp messages; logos as WebP, fonts subset.

- 2026-10-23: Approved (Neo-Brutalism, style 03). First version from the Style Lab.
- 2026-10-24: Update. Added: the built home page (ink opener, crossing bands, scroll-written story with numbered
  stamps, «ماذا نكتب؟» with interactive screens and question card, archive-glimpse files, closing); ink writing
  for key headings; ink flood page transition (cover, hold, drain) and fail-open boot; header with works link or
  back control and no WhatsApp; works archive (folders, sheets, filter chips, pull); work page; device frame
  (browser, phone, adaptive); pending sheet; demo UI rules (Halqah, Nabda, Tasjeel: 14px floor, zero as empty
  square, compact phone rules, show-all toggles, container queries); 12fps stop-motion rule and motion catalogue;
  phone rules; hazards learned; architecture. Removed/changed: the single-page landing structure (hero poster with
  falling ink-drop SVG, About pair, Pillars cards), email footer, `.btn--sm` as the nav button, `assets/tokens.css`
  as the live token file, "Entrance only" motion list, `reference/` as a build dependency.
