/* Ink writing for key headings ([data-ink]). When a heading comes into view
   it is split into its rendered lines (whole words only, so Arabic joining is
   never broken) and each line is written in turn, right to left, behind a pen
   nib that rides the writing edge. The ink is its final colour from the first
   stroke. When the last line is done the original text is put back.
   Timing is in 12fps steps and scales with each line's length. */
import { frames } from './steps';
import { reducedMotion } from './reduced';
import { REVEAL_MARGIN, readingOrder } from './pop';

const PER_CHAR = 0.04; // seconds of writing per character
const MIN_LINE = 0.4;
const MAX_LINE = 1.1;

/* The heading's text as it wraps right now, one string per rendered line. */
function splitLines(el: HTMLElement): string[] {
  const words = (el.textContent || '').trim().split(/\s+/);
  el.textContent = '';
  const spans = words.map((w, i) => {
    const s = document.createElement('span');
    s.textContent = w;
    el.appendChild(s);
    if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    return s;
  });
  const lines: string[][] = [];
  let top = Number.NaN;
  spans.forEach((s) => {
    if (Math.abs(s.offsetTop - top) > 2 || Number.isNaN(top)) {
      lines.push([]);
      top = s.offsetTop;
    }
    lines[lines.length - 1].push(s.textContent || '');
  });
  return lines.map((l) => l.join(' '));
}

/** Writes one heading; returns how long the pen is busy with it (ms). */
function write(el: HTMLElement): number {
  const original = el.textContent || '';
  try {
    return build(el, original);
  } catch (err) {
    // Never lose the heading: put the text back and show it.
    console.error(err);
    el.textContent = original;
    el.classList.remove('is-writing');
    el.classList.add('is-written');
    return 0;
  }
}

function build(el: HTMLElement, original: string): number {
  if (reducedMotion()) {
    el.classList.add('is-written');
    return 0;
  }
  const lines = splitLines(el);
  el.textContent = '';
  let delay = 0;
  lines.forEach((text) => {
    const line = document.createElement('span');
    line.className = 'ink-line';
    const run = document.createElement('span');
    run.className = 'ink-run';
    run.textContent = text;
    const nib = document.createElement('i');
    nib.className = 'ink-nib';
    nib.setAttribute('aria-hidden', 'true');
    run.appendChild(nib);
    line.appendChild(run);
    el.appendChild(line);

    const seconds = Math.min(MAX_LINE, Math.max(MIN_LINE, text.length * PER_CHAR));
    run.style.setProperty('--ink-dur', `${Math.round(seconds * 1000)}ms`);
    run.style.setProperty('--ink-steps', String(frames(seconds)));
    run.style.setProperty('--ink-delay', `${Math.round(delay * 1000)}ms`);
    delay += seconds + 0.1;
  });
  el.classList.add('is-writing');
  // Written: put the plain text back so it reflows freely on resize.
  window.setTimeout(() => {
    el.textContent = original;
    el.classList.remove('is-writing');
    el.classList.add('is-written');
  }, delay * 1000 + 150);
  return delay * 1000;
}

/* One pen for the whole page: headings wait their turn and are written one
   after another, in the order they reached the reveal line (reading order
   within a group). */
const queue: HTMLElement[] = [];
let busy = false;
function next(): void {
  const el = queue.shift();
  if (!el) {
    busy = false;
    return;
  }
  busy = true;
  window.setTimeout(next, write(el) + 60);
}
function enqueue(els: HTMLElement[]): void {
  queue.push(...readingOrder(els));
  if (!busy) next();
}

export function initInkWrite(root: ParentNode = document): void {
  const els = Array.from(root.querySelectorAll<HTMLElement>('[data-ink]'));
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-written'));
    return;
  }
  // A fully clipped element never intersects, so watch each heading's parent.
  const byParent = new Map<Element, HTMLElement[]>();
  els.forEach((el) => {
    const parent = el.parentElement ?? el;
    byParent.set(parent, [...(byParent.get(parent) ?? []), el]);
  });
  const io = new IntersectionObserver(
    (entries) => {
      const arrived: HTMLElement[] = [];
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        arrived.push(...(byParent.get(e.target) ?? []));
        io.unobserve(e.target);
      });
      if (arrived.length) enqueue(arrived);
    },
    { threshold: 0, rootMargin: REVEAL_MARGIN },
  );
  byParent.forEach((_, parent) => io.observe(parent));
}
