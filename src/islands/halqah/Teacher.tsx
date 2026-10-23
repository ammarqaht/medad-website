/* Teacher portal: today's page for one circle opens by itself (no start or
   close button). One card per student: attendance (three states) and three
   recitation lines. Saving is per card. Past days are accepted, future days
   are refused with a clear alert. */
import { useRef, useState } from 'preact/hooks';
import { LINES, TEACHER_CIRCLE, TODAY, emptyLine, key, ui, type Att, type Entry, type LineKey, type Student } from '../../data/halqah';
import { DayPicker, Mark, Num } from './parts';
import { ar, circleById, isFuture, studentsOf, tally, type Action, type State } from './store';

const T = ui.teacher;
const ATTS: Att[] = ['present', 'late', 'absent'];

export function Teacher({ entries, dispatch }: { entries: State['entries']; dispatch: (a: Action) => void }) {
  const c = circleById(TEACHER_CIRCLE);
  const [day, setDay] = useState(TODAY);
  const [refused, setRefused] = useState(0);
  const t = tally(entries, c.id, 0, day);

  const pick = (d: number) => {
    if (isFuture(0, d)) {
      // A new key each time so the alert is announced again on every refusal.
      setRefused((n) => n + 1);
      return;
    }
    setRefused(0);
    setDay(d);
  };

  return (
    <section class="hq-teacher" aria-labelledby="hq-teacher">
      <div class="hq-teacher__head">
        <h3 class="hq-h" id="hq-teacher">{c.name}</h3>
        <p class="hq-sub">{T.hello} {c.teacher}</p>
        <p class="hq-count" aria-live="polite">{T.recorded} <Num n={t.total - t.missing} /> {ui.admin.of} {ar(t.total)}</p>
      </div>
      <DayPicker
        label={T.daysLabel}
        value={day}
        onPick={pick}
        sub={(d) => (isFuture(0, d) ? ui.notYet : '')}
        subShort={(d) => (isFuture(0, d) ? <Mark label={ui.notYet} empty /> : '')}
      />
      <div class="hq-alert-slot" role="alert">
        {refused > 0 && <p class="hq-alert" key={refused}>{T.future}</p>}
      </div>
      <ul class="hq-cards">
        {studentsOf(c.id).map((s) => (
          <StudentCard
            key={`${day}:${s.id}`}
            student={s}
            day={day}
            entry={entries[key(0, day, s.id)]}
            teacher={c.teacher}
            onSave={(entry) => dispatch({ type: 'save', week: 0, day, student: s.id, entry })}
          />
        ))}
      </ul>
    </section>
  );
}

interface CardProps {
  student: Student;
  day: number;
  entry?: Entry;
  teacher: string;
  onSave: (e: Entry) => void;
}

type Status = 'clean' | 'dirty' | 'saved';

function StudentCard({ student, day, entry, teacher, onSave }: CardProps) {
  const [att, setAtt] = useState<Att | null>(entry?.att ?? null);
  const [lines, setLines] = useState<Record<LineKey, ReturnType<typeof emptyLine>>>(
    () => entry?.lines ?? { kubra: emptyLine(), sughra: emptyLine(), dars: emptyLine() },
  );
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>(entry ? 'saved' : 'clean');
  const [error, setError] = useState(false);
  const firstRadio = useRef<HTMLInputElement>(null);
  const id = `hq-${day}-${student.id}`;

  const touch = () => setStatus('dirty');
  const setLine = (k: LineKey, patch: Partial<ReturnType<typeof emptyLine>>) => {
    setLines((prev) => ({ ...prev, [k]: { ...prev[k], ...patch } }));
    touch();
  };

  const save = () => {
    if (!att) {
      setError(true);
      firstRadio.current?.focus();
      return;
    }
    setError(false);
    const clean = att === 'absent' ? { kubra: emptyLine(), sughra: emptyLine(), dars: emptyLine() } : lines;
    onSave({ att, lines: clean, by: teacher });
    setStatus('saved');
  };

  const saveBtn = (
    <button type="button" class="hq-btn hq-card__save" onClick={save}>
      {T.save}<span class="hq-sr"> {student.name}</span>
    </button>
  );

  return (
    <li class={`hq-card is-${status}`}>
      <div class="hq-card__top">
        <div class="hq-card__who">
          <h4 class="hq-card__name" id={`${id}-name`}>{student.name}</h4>
          <span class="hq-card__level">{ui.level} {ar(student.level)}</span>
        </div>
        <span class="hq-status" aria-live="polite">
          {status === 'saved' && <span class="hq-stamp">{T.saved}</span>}
          {status === 'dirty' && <span class="hq-dirty">{T.dirty}</span>}
        </span>
      </div>

      <fieldset class="hq-attpick" aria-describedby={error ? `${id}-err` : undefined}>
        <legend class="hq-sr">{T.attLabel}، {student.name}</legend>
        {ATTS.map((a, i) => (
          <label class={`hq-radio hq-radio--${a}`} key={a}>
            <input
              type="radio"
              name={`${id}-att`}
              value={a}
              checked={att === a}
              ref={i === 0 ? firstRadio : undefined}
              onChange={() => {
                setAtt(a);
                setError(false);
                touch();
              }}
            />
            <span>{ui.att[a]}</span>
          </label>
        ))}
      </fieldset>
      {error && <p class="hq-error" id={`${id}-err`} role="alert">{T.pickAtt}</p>}

      <div class="hq-card__row">
        {att === 'absent' ? (
          <p class="hq-muted">{T.absentNote}</p>
        ) : (
          <button
            type="button"
            class="hq-toggle"
            aria-expanded={open}
            aria-controls={`${id}-lines`}
            onClick={() => setOpen(!open)}
          >
            {T.recitation}<span class="hq-sr"> {student.name}</span>
          </button>
        )}
        {(!open || att === 'absent') && saveBtn}
      </div>

      {att !== 'absent' && (
        <div class="hq-lines-edit" id={`${id}-lines`} hidden={!open}>
          {LINES.map((k) => (
            <fieldset class="hq-ledit" key={k}>
              <legend class="hq-ledit__name">{ui.lines[k]}</legend>
              <div class="hq-ledit__row">
                <label class="hq-check">
                  <input type="checkbox" checked={lines[k].done} onChange={(e) => setLine(k, { done: e.currentTarget.checked })} />
                  <span>{ui.recited}</span>
                </label>
                <div class="hq-stepper">
                  <span class="hq-stepper__label" id={`${id}-${k}-e`}>{T.errors}</span>
                  <button
                    type="button"
                    class="hq-stepper__btn"
                    aria-label={`${T.less} ${ui.lines[k]}`}
                    disabled={lines[k].errors === 0}
                    onClick={() => setLine(k, { errors: Math.max(0, lines[k].errors - 1) })}
                  >
                    <span class="hq-minus" aria-hidden="true"></span>
                  </button>
                  <output class="hq-stepper__val" aria-labelledby={`${id}-${k}-e`} aria-live="polite"><Num n={lines[k].errors} /></output>
                  <button
                    type="button"
                    class="hq-stepper__btn"
                    aria-label={`${T.more} ${ui.lines[k]}`}
                    disabled={lines[k].errors >= 20}
                    onClick={() => setLine(k, { errors: lines[k].errors + 1 })}
                  >
                    <span class="hq-plus" aria-hidden="true"></span>
                  </button>
                </div>
              </div>
              <label class="hq-field">
                <span>{T.note}</span>
                <input type="text" value={lines[k].note} maxLength={60} onInput={(e) => setLine(k, { note: e.currentTarget.value })} />
              </label>
            </fieldset>
          ))}
          {open && <div class="hq-card__row hq-card__row--end">{saveBtn}</div>}
        </div>
      )}
    </li>
  );
}
