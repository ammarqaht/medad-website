/* Runs a callback once the page is visible to the visitor: at once on a normal
   load, or after the ink curtain has drained when the page arrived under it.
   Page animations start here, so none of them plays out unseen beneath the ink. */
const DRAIN_MS = 420; // keep in step with FLOOD_DRAIN_MS in transition.ts

export function whenUncovered(cb: () => void): void {
  const root = document.documentElement;
  if (!root.hasAttribute('data-flood')) {
    cb();
    return;
  }
  const mo = new MutationObserver(() => {
    if (root.hasAttribute('data-flood')) return;
    mo.disconnect();
    window.setTimeout(cb, DRAIN_MS);
  });
  mo.observe(root, { attributes: true, attributeFilter: ['data-flood'] });
}
