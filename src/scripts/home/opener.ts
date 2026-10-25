/* The ink opener (FR-04), at 12 frames per second:
   1. The paper is empty.
   2. One drop of ink falls to the centre of the stage.
   3. It spreads, frame by frame, into a blot. The logo is paper the ink never
      touches: it sits in paper colour from the start, so it emerges in white
      as the ink reaches around it. A hard green shadow lands and short impact
      strokes fly out once the blot is full. The end state is a clean blot.
   4. The headline stamps in word by word.
   The text is in the HTML from the start; this only animates its reveal.
   Any input (scroll, touch, key, a tap on the stage) skips to the end. Later visits in the session, reduced motion
   and a missing canvas all show the final state at once. */
import { reducedMotion } from '../motion/reduced';
import { FPS } from '../motion/steps';
import { FLOOD_DRAIN_MS, FLOOD_HOLD_MS } from '../transition';

const SEEN = 'medad-opened';
const FRAME = 1000 / FPS;

const FALL = 6; // frames the drop takes to fall
/* The blot's growth after impact: slow at first, a stepped overshoot at the end. */
const SPREAD = [0.05, 0.1, 0.17, 0.26, 0.37, 0.49, 0.61, 0.73, 0.84, 0.94, 1.04, 0.98, 1];
const FULL_AT = FALL + 10; // first frame at full size
const SHADOW_AT = FULL_AT + 1;
const STROKES = 5; // frames the impact strokes fly out
const END = FALL + SPREAD.length + 2;

/* Canvas reaches past the stage so the impact strokes are never cut at its edges. */
const BLEED = 0.07;

type Shape = {
  waves: { k: number; amp: number; ph: number }[];
};

/* Deterministic randomness: the blot looks the same on every visit and resize. */
function random(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function makeShape(): Shape {
  const r = random(173);
  const waves = [2, 3, 5, 7, 11].map((k) => ({ k, amp: 0.025 + r() * (k > 5 ? 0.02 : 0.06), ph: r() * Math.PI * 2 }));
  return { waves };
}

export function initOpener(): void {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const stage = hero?.querySelector<HTMLElement>('[data-stage]');
  const canvas = stage?.querySelector('canvas');
  const word = stage?.querySelector<HTMLElement>('[data-word]');
  if (!hero || !stage || !canvas || !word) return;

  const root = document.documentElement;
  const ctx = canvas.getContext('2d');
  const shape = makeShape();
  const css = getComputedStyle(root);
  const INK = css.getPropertyValue('--ink').trim() || '#0C1715';
  const GREEN = css.getPropertyValue('--green-500').trim() || '#1A8A7D';

  // Stage size (sw, sh) and the canvas bleed around it (bx, by).
  let sw = 0;
  let sh = 0;
  let bx = 0;
  let by = 0;
  let wordBox = { x: 0, y: 0, w: 0, h: 0 }; // in canvas coordinates
  let frame = -1;
  let final = false;
  let timer = 0;
  let done = false;

  const size = () => {
    const box = stage.getBoundingClientRect();
    const wb = word.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    sw = box.width;
    sh = box.height;
    bx = sw * BLEED;
    by = sw * BLEED;
    canvas.style.setProperty('inset', `${-by}px ${-bx}px`);
    canvas.style.setProperty('inline-size', `${sw + bx * 2}px`);
    canvas.style.setProperty('block-size', `${sh + by * 2}px`);
    canvas.width = Math.round((sw + bx * 2) * dpr);
    canvas.height = Math.round((sh + by * 2) * dpr);
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    wordBox = { x: wb.left - box.left + bx, y: wb.top - box.top + by, w: wb.width, h: wb.height };
  };

  const blob = (cx: number, cy: number, rx: number, ry: number, color: string) => {
    if (!ctx) return;
    ctx.fillStyle = color;
    ctx.beginPath();
    const n = 120;
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * Math.PI * 2;
      let f = 1;
      for (const wv of shape.waves) f += wv.amp * Math.sin(wv.k * t + wv.ph);
      const x = cx + Math.cos(t) * rx * f;
      const y = cy + Math.sin(t) * ry * f;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  };

  /* The blot behind the logo. */
  const blot = (scale: number, dx: number, dy: number, color: string) => {
    if (!ctx || scale <= 0) return;
    const cx = bx + sw / 2 + dx;
    const cy = by + sh / 2 + dy;
    blob(cx, cy, sw * 0.4 * scale, sh * 0.37 * scale, color);
  };

  /* The single drop, falling to the centre of the stage. */
  const fallingDrop = (f: number) => {
    if (!ctx) return;
    const x = bx + sw / 2;
    const y = by + sh / 2;
    const r = Math.max(8, sw * 0.022);
    const p = (f + 1) / FALL;
    const cy = -r * 3 + (y + r * 3) * p * p;
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.moveTo(x, cy - r * 2.4);
    ctx.bezierCurveTo(x + r * 0.2, cy - r * 1.6, x + r, cy - r * 0.6, x + r, cy);
    ctx.arc(x, cy, r, 0, Math.PI);
    ctx.bezierCurveTo(x - r, cy - r * 0.6, x - r * 0.2, cy - r * 1.6, x, cy - r * 2.4);
    ctx.fill();
  };


  /* Impact: short straight strokes fly out from the blot's edge, like a stamp
     hitting paper. Kept out of the lower sector, where the headline sits. */
  const IMPACT = [-2.6, -2.1, -1.57, -1.05, -0.5, 0.05, 3.09, 3.65];
  const strokes = (f: number) => {
    if (!ctx || f < 0 || f >= STROKES) return;
    const cx = bx + sw / 2;
    const cy = by + sh / 2;
    const t = f / (STROKES - 1);
    ctx.strokeStyle = INK;
    ctx.lineCap = 'square';
    ctx.lineWidth = Math.max(4, sw * 0.007);
    for (const a of IMPACT) {
      const from = 1.08 + t * 0.12;
      const to = from + 0.1 - t * 0.06;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * sw * 0.4 * from, cy + Math.sin(a) * sh * 0.37 * from);
      ctx.lineTo(cx + Math.cos(a) * sw * 0.4 * to, cy + Math.sin(a) * sh * 0.37 * to);
      ctx.stroke();
    }
  };

  const shadowOffset = () => [-Math.max(8, sw * 0.018), Math.max(8, sw * 0.022)] as const;

  const draw = () => {
    if (!ctx) return;
    ctx.clearRect(0, 0, sw + bx * 2, sh + by * 2);
    if (final) {
      const [dx, dy] = shadowOffset();
      blot(1, dx, dy, GREEN);
      blot(1, 0, 0, INK);
      return;
    }
    if (frame < 0) return;

    if (frame < FALL) {
      fallingDrop(frame);
      return;
    }
    if (frame >= SHADOW_AT) {
      const [dx, dy] = shadowOffset();
      blot(1, dx, dy, GREEN);
    }
    blot(SPREAD[Math.min(frame - FALL, SPREAD.length - 1)], 0, 0, INK);
    strokes(frame - FULL_AT);
  };


  const seen = () => {
    try {
      sessionStorage.setItem(SEEN, '1');
    } catch {
      /* storage blocked: the opener simply plays again next time */
    }
  };

  /* Lift every hidden state first, then draw: a canvas failure must never
     leave the hero hidden. */
  const finish = () => {
    if (done) return;
    done = true;
    window.clearTimeout(timer);
    root.classList.remove('opening');
    hero.classList.remove('is-titling');
    try {
      final = true;
      draw();
      hero.classList.add('has-blot');
    } catch (err) {
      console.error(err);
      stage.classList.add('no-canvas');
    }
    seen();
    ['wheel', 'touchstart', 'keydown'].forEach((ev) => window.removeEventListener(ev, finish));
  };

  const redraw = () => {
    size();
    draw();
  };
  size();
  new ResizeObserver(redraw).observe(stage);
  // The word's box changes when the display font arrives.
  document.fonts?.ready.then(redraw);

  if (!ctx) {
    stage.classList.add('no-canvas');
    window.clearTimeout(window.__medadBoot?.opening);
    finish();
    return;
  }

  // We own the opener now: replace boot.js's fail-open timer with our own end.
  window.clearTimeout(window.__medadBoot?.opening);
  if (!root.classList.contains('opening') || reducedMotion()) {
    finish();
    return;
  }

  ['wheel', 'touchstart', 'keydown'].forEach((ev) => window.addEventListener(ev, finish, { passive: true, once: true }));
  stage.addEventListener('pointerdown', finish, { once: true });

  // Seen as soon as it starts: leaving mid-opener does not replay it.
  seen();
  // Arriving under the ink flood: wait for its fixed hold and drain before the first drop.
  const wait = root.hasAttribute('data-flood')
    ? Math.max(0, FLOOD_HOLD_MS - performance.now()) + FLOOD_DRAIN_MS + 60
    : 150;
  // Never hold the page longer than the requirement allows (counted from when it is uncovered).
  window.setTimeout(finish, wait + 4650);

  const tick = () => {
    if (done) return;
    try {
      frame++;
      draw();
      if (frame === END) {
        hero.classList.add('is-titling');
        timer = window.setTimeout(finish, 1500);
        return;
      }
      timer = window.setTimeout(tick, FRAME);
    } catch (err) {
      console.error(err);
      finish();
    }
  };
  timer = window.setTimeout(tick, wait);
}
