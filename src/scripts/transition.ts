/* Ink flood between pages (FR-03). On an internal link, ink spreads from the
   click point in stepped frames and covers the screen; the next page opens
   still covered (boot.js) and the ink drains away. Total animation < 1s.
   Reduced motion, modified clicks and file links: plain navigation. */
import { reducedMotion } from './motion/reduced';

const KEY = 'medad-flood';
const COVER_MS = 420;
const STUCK_MS = 4000;

const clean = (path: string) => path.replace(/\/+$/, '') || '/';

export function initFlood(): void {
  const flood = document.querySelector<HTMLElement>('.flood');
  const root = document.documentElement;
  // We own the flood now: cancel boot.js's fail-open timer.
  window.clearTimeout(window.__medadBoot?.flood);
  if (!flood) {
    root.removeAttribute('data-flood');
    return;
  }

  const reset = () => {
    flood.classList.remove('is-covering', 'is-receding');
    root.removeAttribute('data-flood');
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* storage blocked */
    }
  };

  const recede = () => {
    root.removeAttribute('data-flood');
    flood.classList.remove('is-covering');
    flood.classList.add('is-receding');
    flood.addEventListener('animationend', () => flood.classList.remove('is-receding'), { once: true });
  };

  if (root.hasAttribute('data-flood')) recede();

  // Back/forward cache restores the old page mid-cover: clear it.
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) reset();
  });

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.('a[href]');
    if (!(a instanceof HTMLAnchorElement)) return;
    if ((a.target && a.target !== '_self') || a.hasAttribute('download') || a.hasAttribute('data-no-flood')) return;
    if (/\bexternal\b/.test(a.rel)) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (/\.[a-z0-9]+$/i.test(url.pathname)) return; // files (pdf, png...) are not pages
    if (clean(url.pathname) === clean(location.pathname) && url.search === location.search) return;
    if (reducedMotion()) return;

    e.preventDefault();
    // Keyboard activation has no pointer position: spread from the centre.
    const fromPointer = e.detail > 0;
    flood.style.setProperty('--fx', fromPointer ? `${e.clientX}px` : '50%');
    flood.style.setProperty('--fy', fromPointer ? `${e.clientY}px` : '50%');
    flood.classList.remove('is-receding');
    flood.classList.add('is-covering');
    try {
      sessionStorage.setItem(KEY, '1');
    } catch {
      /* storage blocked: the next page simply opens uncovered */
    }
    window.setTimeout(() => {
      location.assign(url.href);
      // Navigation failed or was stopped: give the page back.
      window.setTimeout(reset, STUCK_MS);
    }, COVER_MS);
  });
}
