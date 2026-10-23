/* The ink opener (FR-04), at 12 frames per second:
   1. The paper is empty.
   2. Drops fall one by one, right to left (the writing direction); each one
      splashes where it lands and reveals its part of the logo in ink.
   3. Once the word is full, a blot bursts out behind it with a hard green
      shadow and straight impact strokes that vanish; the logo turns to paper
      and is stamped down. The end state is a clean blot, nothing around it.
   4. The headline stamps in word by word.
   The text is in the HTML from the start; this only animates its reveal.
   Any input (scroll, touch, key, a tap on the stage) skips to the end. Later visits in the session, reduced motion
   and a missing canvas all show the final state at once. */
import { reducedMotion } from '../motion/reduced';
import { FPS } from '../motion/steps';
import { FLOOD_DRAIN_MS, FLOOD_HOLD_MS } from '../transition';

const SEEN = 'medad-opened';
const FRAME = 1000 / FPS;

const DROPS = 5; // drops that dye the word
const FALL = 5; // frames a drop takes to fall
const GAP = 3; // frames between drops
const BURST_AT = (DROPS - 1) * GAP + FALL + 2;
const SPREAD = [0.18, 0.42, 0.68, 0.9, 1.06, 0.97, 1];
const SHADOW_AT = BURST_AT + 4;
const STROKES = 5; // frames the impact strokes fly out
const END = BURST_AT + SPREAD.length + 1;

/* Canvas reaches past the stage so splatter is never cut at its edges. */
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

  /* The big blot behind the word, with its splatter. */
  const blot = (scale: number, dx: number, dy: number, color: string) => {
    if (!ctx || scale <= 0) return;
    const cx = bx + sw / 2 + dx;
    const cy = by + sh / 2 + dy;
    blob(cx, cy, sw * 0.4 * scale, sh * 0.37 * scale, color);
  };

  /* Where drop i lands: across the word, right to left. */
  const landing = (i: number) => ({
    x: wordBox.x + wordBox.w * (1 - (i + 0.5) / DROPS),
    y: wordBox.y + wordBox.h * 0.55,
  });

  const fallingDrop = (i: number, f: number) => {
    if (!ctx) return;
    const { x, y } = landing(i);
    const r = Math.max(6, sw * 0.016);
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

  const splat = (i: number, age: number) => {
    const { x, y } = landing(i);
    const grow = [0.5, 1.15, 1][Math.min(age, 2)];
    const r = wordBox.h * 0.22 * grow;
    blob(x, y, r * 1.2, r * 0.8, INK);
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

    if (frame >= BURST_AT) {
      const i = frame - BURST_AT;
      if (frame >= SHADOW_AT) {
        const [dx, dy] = shadowOffset();
        blot(1, dx, dy, GREEN);
      }
      blot(SPREAD[Math.min(i, SPREAD.length - 1)], 0, 0, INK);
      strokes(i - 3);
    }
    // Drops falling and the splats they leave on the word (until the burst covers them).
    for (let d = 0; d < DROPS; d++) {
      const f = frame - d * GAP;
      if (f < 0) continue;
      if (f < FALL) fallingDrop(d, f);
      else if (frame < BURST_AT + 3) splat(d, f - FALL);
    }
  };

  /* How much of the word is dyed: one part per landed drop. */
  const dye = () => {
    let landed = 0;
    for (let d = 0; d < DROPS; d++) if (frame - d * GAP >= FALL) landed++;
    word.style.setProperty('--dyed', `${(landed / DROPS) * 100}%`);
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
    hero.classList.remove('is-dyeing', 'is-burst', 'is-titling');
    word.style.removeProperty('--dyed');
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
  hero.classList.add('is-dyeing');
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
      dye();
      if (frame === BURST_AT + 4) hero.classList.add('is-burst', 'has-blot');
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
