/* Archive behaviour:
   - arm filters (buttons, aria-pressed, ?arm= in the URL);
   - per window, folder icons act as one selection: click, tap, Enter or Space
     selects (aria-pressed, roving tabindex); arrow keys move the selection in
     reading order (left = next in RTL); the preview pane follows;
   - double-click on a folder, or «افتح» in the preview, opens: the paper rises
     out of the folder (480ms, stepped), then a re-dispatched click hands the
     link to the ink flood. One opening at a time (W1); the pointer position is
     kept so the ink spreads from the finger (W2). Reduced motion or modified
     clicks: plain navigation. */
import { reducedMotion } from '../../scripts/motion/reduced';

const OPEN_MS = 480;
const ARMS = ['digital', 'live'];

export function initArchive(): void {
  const root = document.querySelector<HTMLElement>('[data-archive]');
  if (!root) return;

  /* ---------- Arm filters ---------- */
  const bar = root.querySelector<HTMLElement>('[data-filters]');
  const chips = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-filter]'));
  const windows = Array.from(root.querySelectorAll<HTMLElement>('[data-window]'));
  const status = root.querySelector<HTMLElement>('[data-filter-status]');

  const apply = (filter: string, announce: boolean) => {
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.filter === filter)));
    windows.forEach((w) => {
      const show = filter === 'all' || w.dataset.arm === filter;
      const was = !w.hidden;
      w.hidden = !show;
      if (show && !was && !reducedMotion()) {
        w.classList.remove('is-restamp');
        void w.offsetWidth; // restart the stamp
        w.classList.add('is-restamp');
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

  /* ---------- Opening: the paper rises, then the flood ---------- */
  let opening = false;
  const open = (link: HTMLAnchorElement, host: HTMLElement | null, e: MouseEvent) => {
    if (opening) return;
    opening = true;
    host?.classList.add('is-opening');
    window.setTimeout(() => {
      link.dataset.opened = '1';
      link.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true, detail: e.detail, clientX: e.clientX, clientY: e.clientY }),
      );
    }, OPEN_MS);
  };
  const plain = (e: MouseEvent) =>
    e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || reducedMotion();

  /* ---------- Windows: selection and preview ---------- */
  windows.forEach((win) => {
    const icons = Array.from(win.querySelectorAll<HTMLButtonElement>('[data-icon]'));
    const panes = Array.from(win.querySelectorAll<HTMLElement>('[data-peek-pane]'));
    const iconFor = (pane: HTMLElement | null) => icons.find((b) => b.dataset.peek === pane?.id) ?? null;

    const select = (icon: HTMLButtonElement, focus: boolean) => {
      icons.forEach((b) => {
        const on = b === icon;
        b.setAttribute('aria-pressed', String(on));
        b.tabIndex = on ? 0 : -1;
        b.classList.toggle('is-selected', on);
      });
      panes.forEach((p) => {
        const on = p.id === icon.dataset.peek;
        p.classList.toggle('is-shown', on);
        if (on && !reducedMotion()) {
          p.classList.remove('is-fresh');
          void p.offsetWidth;
          p.classList.add('is-fresh');
        }
      });
      if (focus) icon.focus();
    };

    icons.forEach((icon, i) => {
      icon.addEventListener('click', () => select(icon, false));
      icon.addEventListener('dblclick', (e) => {
        const link = win.querySelector<HTMLAnchorElement>(`#${icon.dataset.peek} a[data-sheet]`);
        if (!link) return;
        if (plain(e)) {
          link.click();
          return;
        }
        open(link, icon, e);
      });
      icon.addEventListener('keydown', (e) => {
        // Reading order is right to left: the left arrow goes to the next folder.
        const step = { ArrowLeft: 1, ArrowDown: 1, ArrowRight: -1, ArrowUp: -1 }[e.key];
        let next: number | null = null;
        if (step) next = (i + step + icons.length) % icons.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = icons.length - 1;
        if (next === null) return;
        e.preventDefault();
        select(icons[next], true);
      });
    });

    win.querySelectorAll<HTMLAnchorElement>('a[data-sheet]').forEach((link) => {
      link.addEventListener('click', (e) => {
        if (link.dataset.opened === '1') return;
        if (plain(e)) return;
        e.preventDefault();
        open(link, iconFor(link.closest<HTMLElement>('[data-peek-pane]')), e);
      });
    });
  });

  // Back/forward cache brings the page back mid-opening: put the paper away.
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    opening = false;
    root.querySelectorAll('.is-opening').forEach((el) => el.classList.remove('is-opening'));
    root.querySelectorAll<HTMLAnchorElement>('a[data-sheet]').forEach((a) => delete a.dataset.opened);
  });
}
