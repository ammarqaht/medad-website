/* Archive behaviour: arm filters (buttons, aria-pressed, ?arm= in the URL)
   and the "pull the sheet out of its folder" moment before navigating.
   The pull is stepped (12fps) and short; after it, a synthetic click hands
   the link to the ink flood. Reduced motion or modified clicks: no pull. */
import { reducedMotion } from '../../scripts/motion/reduced';

const PULL_MS = 500;
const ARMS = ['digital', 'live'];

export function initArchive(): void {
  const root = document.querySelector<HTMLElement>('[data-archive]');
  if (!root) return;

  const bar = root.querySelector<HTMLElement>('[data-filters]');
  const chips = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-filter]'));
  const shelves = Array.from(root.querySelectorAll<HTMLElement>('[data-arm]'));
  const status = root.querySelector<HTMLElement>('[data-filter-status]');

  const apply = (filter: string, announce: boolean) => {
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.filter === filter)));
    shelves.forEach((s) => {
      const show = filter === 'all' || s.dataset.arm === filter;
      const was = !s.hidden;
      s.hidden = !show;
      if (show && !was && !reducedMotion()) {
        s.classList.remove('is-restamp');
        void s.offsetWidth; // restart the stamp
        s.classList.add('is-restamp');
      }
    });
    const url = new URL(location.href);
    if (filter === 'all') url.searchParams.delete('arm');
    else url.searchParams.set('arm', filter);
    history.replaceState(history.state, '', url.pathname + url.search + url.hash);
    if (announce && status) {
      const chip = chips.find((c) => c.dataset.filter === filter);
      status.textContent = `${status.dataset.label}: ${chip?.dataset.name ?? ''}`;
    }
  };

  if (bar) {
    bar.hidden = false;
    chips.forEach((c) =>
      c.addEventListener('click', () => {
        const f = c.dataset.filter ?? 'all';
        // Pressing the active arm again returns to all.
        apply(c.getAttribute('aria-pressed') === 'true' && f !== 'all' ? 'all' : f, true);
      }),
    );
    const start = new URLSearchParams(location.search).get('arm');
    apply(start && ARMS.includes(start) ? start : 'all', false);
  }

  // Pull a sheet out of its folder, then let the flood take the click.
  // One pull at a time: a double tap or a repeated Enter cannot queue a second navigation.
  let pulling = false;
  root.querySelectorAll<HTMLAnchorElement>('a[data-sheet]').forEach((a) => {
    a.addEventListener('click', (e) => {
      if (a.dataset.pulled === '1') return;
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (reducedMotion()) return;
      e.preventDefault();
      if (pulling) return;
      pulling = true;
      root.classList.add('is-pulling');
      a.closest('[data-folder]')?.classList.add('is-open');
      a.classList.add('is-pulled');
      window.setTimeout(() => {
        a.dataset.pulled = '1';
        // Same pointer position, so the ink spreads from the finger; keyboard keeps detail 0 (centre).
        a.dispatchEvent(
          new MouseEvent('click', { bubbles: true, cancelable: true, detail: e.detail, clientX: e.clientX, clientY: e.clientY }),
        );
      }, PULL_MS);
    });
  });

  // Back/forward cache brings the page back mid-pull: put the sheet away.
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    pulling = false;
    root.classList.remove('is-pulling');
    root.querySelectorAll('.is-open').forEach((el) => el.classList.remove('is-open'));
    root.querySelectorAll<HTMLAnchorElement>('a[data-sheet]').forEach((a) => {
      a.classList.remove('is-pulled');
      delete a.dataset.pulled;
    });
  });
}
