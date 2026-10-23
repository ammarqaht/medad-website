/* One place to ask whether the visitor wants less motion. */
const query = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

export function reducedMotion(): boolean {
  return query ? query.matches : false;
}
