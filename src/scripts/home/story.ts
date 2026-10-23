/* The story's ink line (FR-05). The path is built through the chapter stamps
   and written by the scroll; progress moves in fixed increments so the line
   grows in hard frames rather than gliding. Scrolling up takes it back.
   With reduced motion the line is drawn in full and every stamp is lit. */
import { reducedMotion } from '../motion/reduced';

const STEPS = 72; // the line grows in 72 hard increments

export function initStory(): void {
  const section = document.querySelector<HTMLElement>('[data-story]');
  const svg = section?.querySelector<SVGSVGElement>('.story__line');
  const path = svg?.querySelector<SVGPathElement>('path');
  if (!section || !svg || !path) return;
  const nodes = Array.from(section.querySelectorAll<HTMLElement>('[data-node]'));

  let length = 0;
  let hits: number[] = []; // fraction of the line at which each stamp is reached
  let shown = -1;

  const build = () => {
    const box = section.getBoundingClientRect();
    const pts = nodes.map((n) => {
      const r = n.getBoundingClientRect();
      return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 };
    });
    if (!pts.length) return;
    const start = { x: pts[0].x, y: 0 };
    const end = { x: box.width / 2, y: box.height };
    const all = [start, ...pts, end];
    let d = `M${start.x},${start.y}`;
    const partial: string[] = [];
    for (let i = 1; i < all.length; i++) {
      const a = all[i - 1];
      const b = all[i];
      const mid = (b.y - a.y) / 2;
      d += ` C${a.x},${a.y + mid} ${b.x},${b.y - mid} ${b.x},${b.y}`;
      partial.push(d);
    }
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    path.setAttribute('d', d);
    length = path.getTotalLength();
    const probe = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.appendChild(probe);
    hits = partial.slice(0, nodes.length).map((pd) => {
      probe.setAttribute('d', pd);
      return probe.getTotalLength() / length;
    });
    probe.remove();
    path.style.setProperty('stroke-dasharray', `${length} ${length}`);
    shown = -1;
    update();
  };

  const update = () => {
    if (!length) return;
    let p = 1;
    if (!reducedMotion()) {
      const r = section.getBoundingClientRect();
      const vh = window.innerHeight;
      p = Math.min(1, Math.max(0, (vh * 0.75 - r.top) / r.height));
      p = Math.round(p * STEPS) / STEPS;
    }
    if (p === shown) return;
    shown = p;
    path.style.setProperty('stroke-dashoffset', String(length * (1 - p)));
    nodes.forEach((n, i) => n.classList.toggle('is-hit', p >= hits[i] - 0.01));
  };

  build();
  document.fonts?.ready.then(build);
  new ResizeObserver(build).observe(section);
  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        update();
      });
    },
    { passive: true },
  );
}
