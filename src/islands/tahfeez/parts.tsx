/* Small shared pieces of the Tahfeez demo. */
import { ui, type Move, type Status } from '../../data/tahfeez';
import { ar, pointsText } from './store';

/** A number for display. Every zero digit, alone or inside a number, is a
    flat square outline: the Arabic-Indic zero is a lone dot and reads as a
    stray letter dot (DESIGN.md §8). The digits stay whole for assistive tech. */
export function Num({ n }: { n: number }) {
  if (n === 0) return <span class="tf-zero" role="img" aria-label="صفر"></span>;
  const s = ar(n);
  if (!s.includes('٠')) return <>{s}</>;
  return (
    <span class="tf-num" role="img" aria-label={s}>
      {[...s].map((d, i) => (d === '٠' ? <span key={i} class="tf-zero" aria-hidden="true"></span> : d))}
    </span>
  );
}

/** A signed point move, read out in words. */
export function Delta({ n }: { n: number }) {
  return (
    <span class={`tf-delta ${n < 0 ? 'is-down' : 'is-up'}`}>
      <span class="tf-sr">{`${n < 0 ? 'خصم' : 'إضافة'} ${pointsText(n)}`}</span>
      <span aria-hidden="true" dir="ltr">{n < 0 ? '−' : '+'}<Num n={Math.abs(n)} /></span>
    </span>
  );
}

export function StatusChip({ status }: { status: Status }) {
  return <span class={`tf-status tf-status--${status}`}>{ui.status[status]}</span>;
}

/** Latest first. On phone widths the list shows three, then "show all". */
export function Moves({ moves, id, empty }: { moves: Move[]; id: string; empty: string }) {
  if (!moves.length) return <p class="tf-empty">{empty}</p>;
  return (
    <ul class="tf-moves" id={id}>
      {[...moves].reverse().map((m, i) => (
        <li key={`${moves.length - i}`}>
          <span class="tf-moves__what">
            <span class="tf-moves__reason">{m.reason}</span>
            <span class="tf-moves__when">{m.when}</span>
          </span>
          <Delta n={m.delta} />
        </li>
      ))}
    </ul>
  );
}

/** "Show all" for lists clipped on phone widths only (hidden on wide frames). */
export function More({ open, onToggle, controls, count }: { open: boolean; onToggle: () => void; controls: string; count: number }) {
  if (count <= 3) return null;
  return (
    <button type="button" class="tf-more" aria-expanded={open} aria-controls={controls} onClick={onToggle}>
      {open ? ui.showLess : ui.showAll}
    </button>
  );
}
