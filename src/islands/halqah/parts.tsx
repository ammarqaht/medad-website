/* Small shared pieces of the Halqah demo. */
import type { ComponentChildren } from 'preact';
import { DAYS, DAYS_SHORT, LINES, TODAY, ui, type Att, type Entry } from '../../data/halqah';
import { ar, errorsText } from './store';

/** A number for display. Zero is drawn as a flat square outline: the
    Arabic-Indic zero is a lone dot and reads as a stray letter dot (DESIGN.md §8). */
export function Num({ n }: { n: number }) {
  return n === 0 ? <Mark label="صفر" /> : <>{ar(n)}</>;
}

/** A flat square standing in for a word on narrow screens; the word stays for assistive tech. */
export function Mark({ label, empty = false }: { label: string; empty?: boolean }) {
  return <span class={`hq-zero${empty ? ' hq-zero--empty' : ''}`} role="img" aria-label={label}></span>;
}

/** Long text on wide frames, short text on phone widths (container query). */
export function Dual({ long, short }: { long: ComponentChildren; short: ComponentChildren }) {
  return (
    <>
      <span class="hq-long">{long}</span>
      <span class="hq-short">{short}</span>
    </>
  );
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
            <span class="hq-line__name">
              <Dual long={ui.lines[k]} short={ui.linesShort[k]} />
            </span>
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
  /** Text under each day name on wide frames. */
  sub: (day: number) => ComponentChildren;
  /** Compact version for phone widths (defaults to the same). */
  subShort?: (day: number) => ComponentChildren;
  week?: number;
}

/** Sunday to Thursday as pressable cells; the chosen day is "pressed". */
export function DayPicker({ label, value, onPick, sub, subShort = sub, week = 0 }: DayPickerProps) {
  return (
    <div class="hq-days" role="group" aria-label={label}>
      {DAYS.map((name, d) => {
        const today = week === 0 && d === TODAY;
        return (
          <button
            type="button"
            key={d}
            class={`hq-day${today ? ' is-today' : ''}${week === 0 && d > TODAY ? ' is-future' : ''}`}
            aria-pressed={value === d}
            onClick={() => onPick(d)}
          >
            <span class="hq-day__name">
              <Dual long={today ? ui.today : name} short={today ? ui.today : DAYS_SHORT[d]} />
            </span>
            <span class="hq-day__sub">
              <Dual long={sub(d)} short={subShort(d)} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** "Show all" for lists that are clipped on phone widths only (the button hides itself on wide frames). */
export function More({ open, onToggle, controls }: { open: boolean; onToggle: () => void; controls: string }) {
  return (
    <button type="button" class="hq-more" aria-expanded={open} aria-controls={controls} onClick={onToggle}>
      {open ? ui.showLess : ui.showAll}
    </button>
  );
}
