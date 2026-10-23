/* Stamp-in on scroll for [data-pop] elements, one rule for the whole site.

   When: an element lands once its top has climbed past the reveal line
   (REVEAL_MARGIN), so the visitor is already looking at it, not while it is
   still peeking in at the bottom edge.

   Order: elements that arrive together land one after another in reading
   order: top to bottom, and within a row right to left (RTL). A lone element
   lands at once. The class itself is added late (not a CSS delay), so
   anything keyed to .is-in inside the element starts together with it. */

/** The reveal line: an element must pass 22% above the viewport's bottom. */
export const REVEAL_MARGIN = '0px 0px -22% 0px';
/** Seconds between elements that land together. */
const STEP = 0.11;
/** Never make the last of a group wait longer than this. */
const MAX_WAIT = 0.9;
/** Elements whose tops are within this many pixels share a row. */
const ROW = 32;

/** Sort elements into reading order: rows top to bottom, each row right to left. */
export function readingOrder<T extends Element>(els: T[]): T[] {
  const boxes = els.map((el) => ({ el, r: el.getBoundingClientRect() }));
  boxes.sort((a, b) => (Math.abs(a.r.top - b.r.top) > ROW ? a.r.top - b.r.top : b.r.right - a.r.right));
  return boxes.map((b) => b.el);
}

export function initPop(root: ParentNode = document): void {
  const els = Array.from(root.querySelectorAll<HTMLElement>('[data-pop]'));
  if (!els.length) return;

  const land = (el: HTMLElement, delay: number) => {
    el.style.setProperty('--d', '0s');
    if (delay > 0) window.setTimeout(() => el.classList.add('is-in'), delay * 1000);
    else el.classList.add('is-in');
  };

  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => land(el, 0));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      const arrived = entries.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement);
      const step = arrived.length > 1 ? Math.min(STEP, MAX_WAIT / (arrived.length - 1)) : 0;
      readingOrder(arrived).forEach((el, i) => {
        io.unobserve(el);
        land(el, i * step);
      });
    },
    { threshold: 0, rootMargin: REVEAL_MARGIN },
  );
  els.forEach((el) => io.observe(el));
}
