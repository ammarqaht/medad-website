/* Small shared pieces of the Halqah demo. */
import type { ComponentChildren } from 'preact';
import { DAYS, LINES, TODAY, ui, type Att, type Entry } from '../../data/halqah';
import { ar, errorsText } from './store';

/** A number for display. Zero is drawn as a flat square outline: the
    Arabic-Indic zero is a lone dot and reads as a stray letter dot (DESIGN.md §8). */
export function Num({ n }: { n: number }) {
  return n === 0 ? <span class="hq-zero" role="img" aria-label="صفر"></span> : <>{ar(n)}</>;
}

export function AttChip({ att }: { att: Att | null }) {
  return <span class={`hq-att hq-att--${att ?? 'none'}`}>{att ? ui.att[att] : ui.notRecorded}</span>;
}

/** Read-only view of one day's three recitation lines. */
export function LinesView({ entry, showNotes = false }: { entry: Entry; showNotes?: boolean }) {
  if (entry.att === 'absent') return null;
  return (
    <ul class="hq-lines">
      {LINES.map((k) => {
        const l = entry.lines[k];
        return (
          <li class={`hq-line ${l.done ? 'is-done' : 'is-missed'}`} key={k}>
            <span class="hq-line__name">{ui.lines[k]}</span>
            <span class="hq-line__state">{l.done ? ui.recited : ui.notRecited}</span>
            {l.done && <span class="hq-line__err">{errorsText(l.errors, ui.noErrors)}</span>}
            {showNotes && l.note && <span class="hq-line__note">{l.note}</span>}
          </li>
        );
      })}
    </ul>
  );
}

interface DayPickerProps {
  label: string;
  value: number;
  onPick: (day: number) => void;
  /** Text under each day name. */
  sub: (day: number) => ComponentChildren;
  /** Days that cannot be chosen still announce why when pressed. */
  week?: number;
  dense?: boolean;
}

/** Sunday to Thursday as pressable cells; the chosen day is "pressed". */
export function DayPicker({ label, value, onPick, sub, week = 0, dense = false }: DayPickerProps) {
  return (
    <div class={`hq-days${dense ? ' hq-days--dense' : ''}`} role="group" aria-label={label}>
      {DAYS.map((name, d) => (
        <button
          type="button"
          key={d}
          class={`hq-day${week === 0 && d === TODAY ? ' is-today' : ''}${week === 0 && d > TODAY ? ' is-future' : ''}`}
          aria-pressed={value === d}
          onClick={() => onPick(d)}
        >
          <span class="hq-day__name">{week === 0 && d === TODAY ? ui.today : name}</span>
          <span class="hq-day__sub">{sub(d)}</span>
        </button>
      ))}
    </div>
  );
}
