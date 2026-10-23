/* Supervisor portal: circles follow-up (today's tally and the five-day strip),
   a circle's students with their recorded lines, the roster, and plans and
   exams. Reads the shared entries the teacher writes. */
import { useEffect, useRef, useState } from 'preact/hooks';
import { DAYS, TODAY, circles, exams, key, plans, students, ui } from '../../data/halqah';
import { AttChip, DayPicker, LinesView, Num } from './parts';
import { ar, balance, circleById, isFuture, studentById, studentsOf, tally, type State } from './store';

type Section = 'follow' | 'students' | 'plans';
const A = ui.admin;

export function Supervisor({ entries, onScrollTop }: { entries: State['entries']; onScrollTop: () => void }) {
  const [section, setSection] = useState<Section>('follow');
  const [open, setOpen] = useState<string | null>(null);
  const go = (s: Section) => {
    setSection(s);
    setOpen(null);
    onScrollTop();
  };

  return (
    <div class="hq-admin">
      <nav class="hq-rail" aria-label={A.navLabel}>
        {(Object.keys(A.nav) as Section[]).map((s) => (
          <button type="button" key={s} class="hq-rail__btn" aria-current={section === s ? 'page' : undefined} onClick={() => go(s)}>
            {A.nav[s]}
          </button>
        ))}
      </nav>
      <div class="hq-work hq-enter" key={`${section}:${open ?? ''}`}>
        {section === 'follow' &&
          (open ? (
            <CircleDetail id={open} entries={entries} onBack={() => { setOpen(null); onScrollTop(); }} />
          ) : (
            <Follow entries={entries} onOpen={(id) => { setOpen(id); onScrollTop(); }} />
          ))}
        {section === 'students' && <Roster entries={entries} />}
        {section === 'plans' && <PlansExams />}
      </div>
    </div>
  );
}

function Follow({ entries, onOpen }: { entries: State['entries']; onOpen: (id: string) => void }) {
  return (
    <section aria-labelledby="hq-follow">
      <h3 class="hq-h" id="hq-follow">{A.followTitle}</h3>
      <ul class="hq-circles">
        {circles.map((c) => {
          const t = tally(entries, c.id, 0, TODAY);
          return (
            <li class="hq-circle" key={c.id}>
              <div class="hq-circle__head">
                <h4 class="hq-circle__name">{c.name}</h4>
                <p class="hq-circle__meta">{c.teacher}، {c.slot}</p>
              </div>
              <dl class="hq-tally" aria-label={A.tally}>
                <div class="hq-tally__cell"><dt>{ui.att.present}</dt><dd><Num n={t.present} /></dd></div>
                <div class="hq-tally__cell"><dt>{ui.att.late}</dt><dd><Num n={t.late} /></dd></div>
                <div class="hq-tally__cell"><dt>{ui.att.absent}</dt><dd><Num n={t.absent} /></dd></div>
                <div class="hq-tally__cell hq-tally__cell--missing"><dt>{ui.notRecorded}</dt><dd><Num n={t.missing} /></dd></div>
              </dl>
              <ol class="hq-strip" aria-label={A.week}>
                {DAYS.map((name, d) => {
                  const dt = tally(entries, c.id, 0, d);
                  const done = dt.total - dt.missing;
                  const state = isFuture(0, d) ? 'future' : done === 0 ? 'none' : done === dt.total ? 'full' : 'part';
                  return (
                    <li class={`hq-strip__day is-${state}`} key={d}>
                      <span class="hq-strip__name">{name}</span>
                      <span class="hq-strip__val">
                        {state === 'future' ? ui.notYet : state === 'none' ? ui.notRecorded : `${ar(done)} ${A.of} ${ar(dt.total)}`}
                      </span>
                    </li>
                  );
                })}
              </ol>
              <button type="button" class="hq-btn hq-btn--block" onClick={() => onOpen(c.id)}>
                {A.open}<span class="hq-sr"> {c.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function CircleDetail({ id, entries, onBack }: { id: string; entries: State['entries']; onBack: () => void }) {
  const c = circleById(id);
  const [day, setDay] = useState(TODAY);
  const head = useRef<HTMLHeadingElement>(null);
  useEffect(() => head.current?.focus(), []);
  const future = isFuture(0, day);
  const list = studentsOf(id);
  const any = list.some((s) => entries[key(0, day, s.id)]);

  return (
    <section aria-labelledby="hq-circle">
      <button type="button" class="hq-back" onClick={onBack}>{A.back}</button>
      <h3 class="hq-h" id="hq-circle" tabIndex={-1} ref={head}>{c.name}</h3>
      <p class="hq-sub">{c.teacher}، {c.slot}</p>
      <DayPicker
        label={A.daysLabel}
        value={day}
        onPick={setDay}
        dense
        sub={(d) => {
          if (isFuture(0, d)) return ui.notYet;
          const t = tally(entries, id, 0, d);
          const done = t.total - t.missing;
          return done ? `${ar(done)} ${A.of} ${ar(t.total)}` : ui.notRecorded;
        }}
      />
      {future || !any ? (
        <p class="hq-empty">{future ? A.future : A.nothing}</p>
      ) : (
        <ul class="hq-rows">
          {list.map((s) => {
            const e = entries[key(0, day, s.id)];
            return (
              <li class="hq-row" key={s.id}>
                <div class="hq-row__top">
                  <span class="hq-row__name">{s.name}</span>
                  <AttChip att={e?.att ?? null} />
                </div>
                {e && <LinesView entry={e} />}
                {e && <p class="hq-row__by">{ui.by} {e.by}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Roster({ entries }: { entries: State['entries'] }) {
  const [only, setOnly] = useState<string | null>(null);
  const list = only ? studentsOf(only) : students;
  return (
    <section aria-labelledby="hq-roster">
      <h3 class="hq-h" id="hq-roster">{A.studentsTitle}</h3>
      <div class="hq-chips" role="group" aria-label={A.circlesLabel}>
        <button type="button" class="hq-chip" aria-pressed={only === null} onClick={() => setOnly(null)}>{A.allCircles}</button>
        {circles.map((c) => (
          <button type="button" key={c.id} class="hq-chip" aria-pressed={only === c.id} onClick={() => setOnly(only === c.id ? null : c.id)}>
            {c.name}
          </button>
        ))}
      </div>
      <ul class="hq-roster">
        {list.map((s) => (
          <li class="hq-person" key={s.id}>
            <span class="hq-person__name">{s.name}</span>
            <span class="hq-person__meta">{circleById(s.circle).name}، {ui.tracks[s.track]}، {ui.level} {ar(s.level)}</span>
            <span class="hq-person__pts">{ar(balance(entries, s))} <small>{ui.points}</small></span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PlansExams() {
  return (
    <div class="hq-two">
      <section aria-labelledby="hq-plans">
        <h3 class="hq-h" id="hq-plans">{A.plansTitle}</h3>
        <ul class="hq-roster">
          {plans.map((p) => {
            const s = studentById(p.student);
            return (
              <li class="hq-person" key={p.student}>
                <span class="hq-person__name">{s.name}</span>
                <span class="hq-person__meta">{ui.tracks[s.track]}، {ui.level} {ar(p.level)}، {A.issued} {p.issued}</span>
                <span class="hq-person__pts">{A.planDay} {ar(p.day)} {A.of} {ar(24)}</span>
              </li>
            );
          })}
        </ul>
      </section>
      <section aria-labelledby="hq-exams">
        <h3 class="hq-h" id="hq-exams">{A.examsTitle}</h3>
        <ul class="hq-roster">
          {exams.map((x) => {
            const s = studentById(x.student);
            return (
              <li class="hq-person" key={x.student}>
                <span class="hq-person__name">{s.name}</span>
                <span class="hq-person__meta">
                  {A.exam[x.type]}{x.level ? `، ${ui.level} ${ar(x.level)}` : ''}، {A.score} {ar(x.score)} {A.of} {ar(100)}
                </span>
                <span class={`hq-att hq-att--${x.passed ? 'present' : 'absent'}`}>{x.passed ? A.passed : A.failed}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
