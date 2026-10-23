# Medad Website: Design System (Neo-Brutalism)

> **Status: APPROVED** (owner picked style 03 Neo-Brutalism from the Style Lab, 2026-10-23).
> Source of truth for every page of the Medad website. `design-guardian` checks against this file.
> Origin: `style-lab/styles/03-neo-brutalism/` (copied untouched to `reference/neo-brutalism/`).
> Brand rules (brand word, copy voice, confidentiality) live in `MEDAD.md` and override nothing here; they add to it.

---

## 1. The idea in one paragraph

Raw, loud, honest. Flat blocks of paper, white and logo green, every block outlined in a **3px ink border** and
casting a **hard 6px ink shadow** with zero blur. Things look like stickers and printed slabs placed on a dotted
sheet: slightly rotated, overlapping, unapologetic. Type is huge and black (weight 900). Motion is **stepped**,
never eased: things stamp in, snap, and press down into their own shadow. The ink theme («مداد» = ink) appears as
a literal ink drop falling in hard frames.

**The five laws** (break one and it stops being this style):
1. Ink border on every surface that holds content (`3px solid var(--ink)`).
2. Shadows are hard offsets only. No blur, ever.
3. Flat fills only. No gradients (the only allowed "gradient" is the hard-stop dot grid and stripe patterns).
4. Motion uses `steps()`, never `ease` curves (except the reduced-motion fallback).
5. Weight 700 minimum for body; 900 for every headline, number and button.

---

## 2. Color

Only the logo hue (173.6°) family plus neutrals. No other hue may appear anywhere. Defined in `assets/tokens.css`.

| Token | Hex | Role in this style |
|---|---|---|
| `--paper` | `#F6F4EF` | page background, light buttons on green |
| `--white` | `#FFFFFF` | default `.box` fill (text cards) |
| `--gray` | `#E7E6E1` | the background dot grid; footer small text |
| `--ink` | `#0C1715` | text, every border, every shadow, dark slabs, footer |
| `--ink-muted` | `#4A5552` | secondary text on light (rare in this style) |
| `--green-300` | `#85D6CD` | secondary blocks (about title, 3rd pillar), stickers, hover of light buttons |
| `--green-400` | `#36C9BA` | neon on ink: footer link, separators on ink band, `::selection` text, number hover |
| `--green-500` | `#1A8A7D` | **the logo green**: hero highlight block, poster, primary buttons, marquee band, closing slab |
| `--green-800` | `#083A35` | hover of the dark nav button |

Contrast rules (WCAG AA, measured):
- Ink on `--green-500` = 4.33: text on green blocks must be **19px+ bold** (all our green-block text is 900 and large). Never small text on green-500.
- `--green-500` as **text** on paper = 3.84: large text and graphics only. Small green text uses `--green-600` `#126E64`.
- On ink, readable green is `--green-400` (8.9). Paper on ink = 16.6.

Surface recipes:
- Light card: `--white` + ink border + ink shadow.
- Green slab: `--green-500` + ink border + ink shadow (double offset 12px for the biggest slab).
- Soft block: `--green-300` + ink border + ink shadow.
- Dark band / footer: `--ink` background, `--paper` text, `--green-400` accents.

Background of the page:
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

| Role | Family | Weight | Size (clamp) | Line height |
|---|---|---|---|---|
| Hero headline | Thmanyah Serif Display | 900 | `clamp(60px, 9.4vw, 140px)` | 1.12 |
| Closing headline | Serif Display | 900 | `clamp(46px, 8.2vw, 124px)` | 1.12 |
| Marquee (green band) | Serif Display | 900 | `clamp(34px, 5.6vw, 84px)` | 1.25 |
| Marquee (ink band) | Thmanyah Sans | 900 | `clamp(26px, 3.8vw, 56px)` | 1.25 |
| Section title (H2) | Serif Display | 900 | `clamp(36px, 5.4vw, 76px)` | 1.15 |
| Card title (H3) | Serif Display | 900 | `clamp(30px, 3.4vw, 46px)` | 1.2 |
| Oversized numbers | Serif Display | 900 | `clamp(110px, 15vw, 210px)` | .78 |
| Lead text | Thmanyah Sans | 700 | `clamp(21px, 2.3vw, 32px)` | 1.6 |
| Body | Thmanyah Sans | 700 | `clamp(19px, 1.6vw, 22px)` | 1.6 |
| Buttons | Thmanyah Sans | 900 | lg `clamp(20px, 2.2vw, 26px)`, sm `16px` | 1 |
| Footer | Thmanyah Sans | 500 | 15 to 18px | 1.7 |

Rules:
- `letter-spacing: 0` on all Arabic. Never letter-space Arabic.
- `text-wrap: balance` on big headlines.
- No diacritics in display copy (tight line height makes harakat collide with the next line).
- Numbers are **Arabic-Indic** (١ ٢ ٣) in display, set in the display font, often as outlined numerals:
  ```css
  color: var(--paper); -webkit-text-stroke: 3px var(--ink); paint-order: stroke fill;
  text-shadow: -4.8px 4.8px 0 var(--ink);
  ```
- Kashida: one optional accent word per page in display text, max two tatweels, after a connecting letter
  (e.g. «لنكتـبها»). The brand word is the exception (see `MEDAD.md`).

---

## 4. Core tokens of the style

```css
:root {
  --bw: 3px;                     /* border width */
  --off: 6px;                    /* shadow offset */
  --sx: calc(var(--off) * -1);   /* RTL: shadow falls to the LEFT and down */
  --shadow: var(--sx) var(--off) 0 0 var(--ink);
  --snap: 90ms steps(2, jump-end);    /* hovers, presses, rotations */
  --stamp: 240ms steps(3, jump-end);  /* entrance stamp */
  --gutter: clamp(16px, 4.5vw, 64px);
  --max: 1320px;
}
```

RTL rule for shadows: light comes from the top right, so shadows fall to the **inline end (left) and down**:
`box-shadow: -6px 6px 0 0 var(--ink)`. Every shadow, hover translate and press translate follows this direction.

Radius: **0** everywhere. The only round things are the ink pool ellipse and the ring sticker.

---

## 5. Components

### 5.1 `.box`, the base block
```css
.box { border: var(--bw) solid var(--ink); box-shadow: var(--shadow); background: var(--white); }
```
Every card, panel, text slab, poster and title block is a `.box` with a different fill.

### 5.2 Button (the signature interaction)
- Fill `--green-500`, ink text 900, ink border, hard shadow, a blunt CSS arrow (`::after` clip-path) pointing
  left (reading direction).
- **Hover:** moves half way into its shadow (`translate: -3px 3px`, shadow shrinks to 3px), arrow nudges 4px left.
- **Active / keyboard Enter or Space:** fully pressed (`translate: -6px 6px`, shadow 0). JS adds `.is-pressed` on keydown.
- Variants: `.btn--lg` (hero, closing), `.btn--sm` (nav: ink fill, paper text, **green shadow**, no arrow),
  `.btn--paper` (white fill on green slabs, hover `--green-300`).
- Transition: `translate var(--snap), box-shadow var(--snap), background-color var(--snap)`.

### 5.3 Topbar
Sticky, paper background, 3px ink bottom rule. Logo (`medad-mark-ink.png`, 96 to 128px wide) on the start (right),
small ink button on the end (left).

### 5.4 Hero
- Two columns from 900px (`7fr 5fr`): headline column + **poster**.
- Headline: the **last word is boxed** in a green block (`.hl`: green-500 fill, ink border, shadow, `rotate: -2deg`).
  Done in JS by wrapping the last whole word, never splitting letters.
- Supporting line in a white `.box`, max 34ch, `rotate: .6deg`.
- **Poster:** green-500 slab, `aspect-ratio 4/5`, `rotate: 2deg`, the brand word huge in ink (`30 to 36cqi`),
  container queries for sizing. Decorations: a 16-point star sticker (`--green-300`, ink stroke) on the top corner
  that rotates on hover, a striped barcode block at the bottom, and the **ink drop**.

### 5.5 The ink drop (theme anchor)
An SVG drop that grows, falls and splashes into an ink pool, all with `steps(1, end)` keyframes over 3.2s
(frame-by-frame look, no tweening). The pool squashes on impact. Starts when the poster enters the viewport.
Reduced motion: drop frozen mid-fall.

### 5.6 Crossing marquee bands (signature)
Two full-bleed bands crossing like tape: green band (`rotate: -3deg`, display font, headline + brand word) over an
ink band (`rotate: 2deg`, sans font, service names, green-400 separators). Separators are 5-point clip-path stars.
JS clones units to fill the width and moves by **whole pixels**. RTL: green band moves right, ink band against it.
**Scroll boosts speed, scrolling up reverses direction.** Paused off screen. Bands are `aria-hidden` (decorative
duplicates of real content).

### 5.7 Section title + text pair (About)
Title in a `--green-300` box, `rotate: -2deg` (hover flips to `1deg`), overlapping a large white text box on a
12-column grid (title cols 1 to 5, text cols 5 to 12).

### 5.8 Numbered cards (Pillars)
Asymmetric 12-column layout, cards at different offsets and slight rotations (`-1deg`, `0`, `.8deg`), each a
different fill (white / green-500 / green-300). A giant outlined Arabic numeral sits beside the title.
Hover: half press + numeral changes fill. Reuse this for services, products, steps, stats.

### 5.9 Closing slab
Big green-500 slab with a **double shadow** (12px), headline (kashida variant allowed), paper button, and a ring
sticker (paper ring + ink center) overlapping the corner that spins 38deg on hover.

### 5.10 Stickers (decor vocabulary)
16-point star, 5-point star separators, ring, striped barcode block. Always ink-stroked, flat fills, rotated.
Placed on corners, overlapping edges, never over Arabic text (see 8).

### 5.11 Footer
Ink background, paper logo (`medad-mark-paper.png`, 120px), one line, email in green-400 with a 3px underline that
inverts on hover (green fill, ink text), copyright in `--gray`. Bottom padding leaves room for floating UI.

---

## 6. Layout

- Container `max-inline-size: 1320px`, side gutter `clamp(16px, 4.5vw, 64px)`.
- Mobile first: single column under 900px; 12-column grid with deliberate asymmetry at 900px+.
- Section rhythm: generous vertical padding `clamp(40px, 6vw, 96px)`.
- Asymmetry is the point: offset cards (`margin-block-start: 72px`), overlap title boxes over text boxes, rotate
  1 to 3 degrees. Keep rotations small on text-heavy boxes (under 1deg).
- `overflow-x: clip` on `main`/`body`: rotated bands and stickers must never cause horizontal scroll.
- Logical properties only (`inset-inline-start`, `margin-inline`, `padding-block`).

---

## 7. Motion

| Moment | Spec |
|---|---|
| Entrance | `[data-pop]`: hidden, `scale: 1.14`, then **stamps** to `scale: 1` with `--stamp` (240ms, 3 steps). Staggered via `--d`. IntersectionObserver, threshold .15. After landing, `--d` resets to 0 so hovers snap instantly. |
| Hover / press | `--snap` (90ms, 2 steps) on translate, shadow, rotate, color. |
| Ink drop | 3.2s loop, `steps(1, end)` keyframes. |
| Marquee | rAF, whole-pixel steps, scroll-reactive speed and direction. |
| Stickers | rotate on parent hover with `--snap`. |

`prefers-reduced-motion: reduce`: entrances become a 0.5s opacity fade, no translate on hover/press (color change
instead), bands stand still, drop frozen, stickers fixed.

---

## 8. Hard rules and hazards

- **Arabic dot hazard:** no small dark dots, stars or beads next to or over Arabic text; they read as letter dots
  (a bead above «تعمل» read as «تغمل»). Stickers live on corners and edges, away from words.
- Never split Arabic words into per-letter spans (breaks joining). Animate whole words only.
- The brand word is one unbreakable unit (`.brand-word`).
- No blur, no `backdrop-filter`, no soft shadows, no gradients, no rounded corners, no pastel softness, no
  photos with soft edges (if photos/screenshots appear, frame them in `.box` with ink border and hard shadow).
- No emojis, no English in visible text (except emails/URLs), no captions, eyebrow labels or badge text.
- Focus: `outline: 3px solid var(--ink); outline-offset: 4px` (green-400 on ink surfaces).
- No horizontal scroll at 375, 768, 1440.

---

## 9. Extending the style (for the new, bigger site)

New components must be derived from the vocabulary above. Guidance:
- **Product card:** `.box` filled from the allowed set only (white / green-300 / green-500 / ink), never in the
  product's own brand color. Product screenshot inside a bordered frame with hard shadow, product name 900, one line.
- **Browser / phone frame for screenshots:** ink-bordered rectangle, a 3px title bar with three square dots (not
  circles), hard shadow. Screenshots shown flat, no perspective tilt, optional 1 to 2deg rotation.
- **Stats / numbers:** the outlined giant numeral style.
- **Timeline / story:** thick 3px ink line, square nodes, cards hanging off it alternately (mirrored for RTL).
- **Tabs / filters:** row of `.btn--sm`-like chips; active = pressed state (no shadow, translated).
- **Forms:** inputs = white box, 3px ink border, no radius, focus = green-300 fill + hard shadow appears.
- **Accordion (FAQ):** stacked boxes; open one gets the green-500 fill; toggle icon is a square plus.
- **Dark sections:** ink background, white/green boxes keep ink borders but use **green-500 shadows** (like `.btn--sm`).
