/* Small shared pieces of the Injaz demo: numbers, status chip, leaderboard. */
import { useState } from 'preact/hooks';
import { ME, ui, type SubStatus } from '../../data/injaz';
import { ar, standings, type State } from './store';

/** A number for display. Every zero digit, alone or inside a number, is a
    flat square outline: the Arabic-Indic zero is a lone dot and reads as a
    stray letter dot (DESIGN.md §8). The digits stay whole for assistive tech. */
export function Num({ n }: { n: number }) {
  if (n === 0) return <span class="ij-zero" role="img" aria-label="صفر"></span>;
  const s = ar(n);
  if (!s.includes('٠')) return <>{s}</>;
  return (
    <span class="ij-num" role="img" aria-label={s}>
      {[...s].map((d, i) => (d === '٠' ? <span key={i} class="ij-zero" aria-hidden="true"></span> : d))}
    </span>
  );
}

export function StatusChip({ status }: { status: SubStatus | 'none' }) {
  return <span class={`ij-status ij-status--${status}`}>{ui.status[status]}</span>;
}

/** "Show all" for lists clipped on phone widths only (hidden on wide frames). */
export function More({ open, onToggle, controls, count }: { open: boolean; onToggle: () => void; controls: string; count: number }) {
  if (count <= 3) return null;
  return (
    <button type="button" class="ij-more" aria-expanded={open} aria-controls={controls} onClick={onToggle}>
      {open ? ui.showLess : ui.showAll}
    </button>
  );
}

/** Ranked by points; the current participant is marked and always shown. */
export function Board({ subs, mine = true }: { subs: State['subs']; mine?: boolean }) {
  const [all, setAll] = useState(false);
  const B = ui.board;
  const rows = standings(subs);
  return (
    <section class="ij-card" aria-labelledby="ij-board-h">
      <h3 class="ij-h" id="ij-board-h">{B.title}</h3>
      <ol class={`ij-board${all ? ' is-all' : ''}`} id="ij-board" aria-label={B.label}>
        {rows.map((r) => {
          const me = mine && r.person.id === ME;
          return (
            <li key={r.person.id} class={`ij-board__row${me ? ' is-me' : ''}${r.rank <= 3 ? ' is-top' : ''}`} aria-current={me ? 'true' : undefined}>
              <span class="ij-board__rank"><Num n={r.rank} /></span>
              <span class="ij-board__who">
                <span class="ij-board__name">{r.person.name}{me && <span class="ij-you">، {B.you}</span>}</span>
                <span class="ij-board__done"><Num n={r.done} /> {B.tasks}</span>
              </span>
              <span class="ij-board__pts"><Num n={r.points} /></span>
            </li>
          );
        })}
      </ol>
      <More open={all} onToggle={() => setAll(!all)} controls="ij-board" count={rows.length} />
    </section>
  );
}
