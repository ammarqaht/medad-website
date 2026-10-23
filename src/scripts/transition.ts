/* Ink flood between pages (FR-03). On an internal link, ink spreads from the
   click point in stepped frames and covers the screen; the next page opens
   still covered (boot.js), holds the brand word for a fixed time, then the
   ink drains away. The timing is fixed, not tied to how fast the next page
   loads: cover 420ms, hold until 600ms after the new page starts, drain 420ms
   (about 1.4s in all).
   Reduced motion, modified clicks and file links: plain navigation. */
import { reducedMotion } from './motion/reduced';

const KEY = 'medad-flood';
const COVER_MS = 420;
/** The arriving page stays covered, word showing, until this long after it starts. */
export const FLOOD_HOLD_MS = 600;
export const FLOOD_DRAIN_MS = 420;
const STUCK_MS = 4000;

const clean = (path: string) => path.replace(/\/+$/, '') || '/';

/** A back control returns through history when the visitor came from this site,
    so the previous page keeps its scroll position; otherwise it follows its href. */
function cameFromSite(): boolean {
  if (!document.referrer || history.length < 2) return false;
  try {
    return new URL(document.referrer).origin === location.origin;
  } catch {
    return false;
  }
}

/** Name the back control after the page it will actually return to. */
export function initBack(): void {
  const a = document.querySelector<HTMLAnchorElement>('a[data-back]');
  if (!a) return;
  const from = cameFromSite() ? clean(new URL(document.referrer).pathname) : '';
  const label = from === '/' ? a.dataset.labelHome : from === '/works' ? a.dataset.labelWorks : null;
  if (!label) {
    // Came from elsewhere: follow the link's own destination, not history.
    a.removeAttribute('data-back');
    return;
  }
  const span = a.querySelector('.back__label');
  if (span) span.textContent = label;
  a.href = from;
}

export function initFlood(): void {
  const flood = document.querySelector<HTMLElement>('.flood');
  const root = document.documentElement;
  // We own the flood now: cancel boot.js's fail-open timer.
  window.clearTimeout(window.__medadBoot?.flood);
  if (!flood) {
    root.removeAttribute('data-flood');
    return;
  }

  let hold = 0;
  const reset = () => {
    window.clearTimeout(hold);
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

  /* Hold the cover (brand word showing) until `at` ms on this page's clock, then drain. */
  const holdThenRecede = (at: number) => {
    window.clearTimeout(hold);
    hold = window.setTimeout(recede, Math.max(0, at - performance.now()));
  };

  // performance.now() counts from the start of this navigation, so a fast load
  // still shows the word for the full hold and a slow one drains at once.
  if (root.hasAttribute('data-flood')) holdThenRecede(FLOOD_HOLD_MS);

  // Back/forward cache: boot.js does not run on a restore. The browser's own
  // back button restores the page uncovered; the back control (history.back()
  // after the cover) arrives under the same curtain as any other link.
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    let arriving = false;
    try {
      arriving = sessionStorage.getItem(KEY) === '1';
    } catch {
      /* storage blocked */
    }
    reset();
    if (arriving && !reducedMotion()) {
      root.setAttribute('data-flood', '');
      holdThenRecede(performance.now() + FLOOD_HOLD_MS);
    }
  });

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.('a[href]');
    if (!(a instanceof HTMLAnchorElement)) return;
    if ((a.target && a.target !== '_self') || a.hasAttribute('download') || a.hasAttribute('data-no-flood')) return;
    if (/\bexternal\b/.test(a.rel)) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    const viaHistory = a.hasAttribute('data-back') && cameFromSite();
    if (/\.[a-z0-9]+$/i.test(url.pathname)) return; // files (pdf, png...) are not pages
    if (!viaHistory && clean(url.pathname) === clean(location.pathname) && url.search === location.search) return;
    if (reducedMotion()) {
      if (viaHistory) {
        e.preventDefault();
        history.back();
      }
      return;
    }

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
      if (viaHistory) history.back();
      else location.assign(url.href);
      // Navigation failed or was stopped: give the page back.
      window.setTimeout(reset, STUCK_MS);
    }, COVER_MS);
  });
}
