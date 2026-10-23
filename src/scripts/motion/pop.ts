/* Stamp-in on scroll for [data-pop] elements. data-pop="0.08" staggers by
   seconds. Once landed, the delay is dropped so hovers snap instantly. */
export function initPop(root: ParentNode = document): void {
  // We own the reveal now: cancel boot.js's fail-open timer.
  window.clearTimeout(window.__medadBoot?.js);
  const els = Array.from(root.querySelectorAll<HTMLElement>('[data-pop]'));
  if (!els.length) return;

  els.forEach((el) => {
    const d = parseFloat(el.dataset.pop || '0');
    if (d > 0) el.style.setProperty('--d', `${d}s`);
  });

  const land = (el: HTMLElement) => {
    el.classList.add('is-in');
    window.setTimeout(() => el.style.setProperty('--d', '0s'), 700);
  };

  if (!('IntersectionObserver' in window)) {
    els.forEach(land);
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          land(e.target as HTMLElement);
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -6% 0px' },
  );
  els.forEach((el) => io.observe(el));
}
