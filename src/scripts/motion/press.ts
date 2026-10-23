/* Keyboard presses push a button into its shadow, like a click does. */
export function initPress(): void {
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const btn = (e.target as Element | null)?.closest?.('.btn');
    if (btn) btn.classList.add('is-pressed');
  });
  const release = (e: Event) => {
    const btn = (e.target as Element | null)?.closest?.('.btn');
    if (btn) btn.classList.remove('is-pressed');
  };
  document.addEventListener('keyup', release);
  document.addEventListener('focusout', release);
}
