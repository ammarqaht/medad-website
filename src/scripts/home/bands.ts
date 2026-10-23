/* Marquee bands. Units are cloned until the track covers the band plus one
   unit, then slid by whole pixels. RTL: the green band moves right so new
   words arrive from the left; the ink band runs against it. Scrolling speeds
   them up, scrolling up reverses both. Paused off screen and with reduced motion. */
import { reducedMotion } from '../motion/reduced';

type Band = { band: HTMLElement; track: HTMLElement; unit: HTMLElement; dir: number; pos: number; w: number };

export function initBands(): void {
  const section = document.querySelector<HTMLElement>('[data-bands]');
  if (!section) return;
  const bands: Band[] = Array.from(section.querySelectorAll<HTMLElement>('.band')).map((band) => {
    const track = band.querySelector<HTMLElement>('.band__track')!;
    return { band, track, unit: track.querySelector<HTMLElement>('.band__unit')!, dir: Number(band.dataset.dir) || 1, pos: 0, w: 0 };
  });

  const build = () => {
    bands.forEach((b) => {
      while (b.track.children.length > 1) b.track.lastChild?.remove();
      b.w = b.unit.getBoundingClientRect().width;
      if (!b.w) return;
      const need = Math.ceil((b.band.clientWidth + b.w) / b.w) + 1;
      for (let i = 1; i < need; i++) b.track.appendChild(b.unit.cloneNode(true));
    });
  };
  build();
  document.fonts?.ready.then(build);
  let rt = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(rt);
    rt = window.setTimeout(build, 150);
  });

  if (reducedMotion()) return;

  let lastY = window.scrollY;
  let boost = 0;
  let flip = 1;
  let prev = 0;
  let visible = true;
  new IntersectionObserver((e) => (visible = e[0].isIntersecting)).observe(section);
  window.addEventListener(
    'scroll',
    () => {
      const dy = window.scrollY - lastY;
      lastY = window.scrollY;
      if (dy > 0) flip = 1;
      else if (dy < 0) flip = -1;
      boost = Math.min(boost + Math.abs(dy) * 0.6, 40);
    },
    { passive: true },
  );

  const tick = (t: number) => {
    const dt = prev ? Math.min(t - prev, 50) : 16;
    prev = t;
    if (visible) {
      const speed = (0.07 + boost * 0.012) * dt * flip;
      bands.forEach((b) => {
        if (!b.w) return;
        b.pos += speed * b.dir;
        const off = ((b.pos % b.w) + b.w) % b.w;
        b.track.style.transform = `translate3d(${Math.round(off)}px,0,0)`;
      });
    }
    boost *= 0.92;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
