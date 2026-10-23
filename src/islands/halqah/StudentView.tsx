/* Student portal: level, points balance, "my attendance and recitation" as a
   Sunday to Thursday week with arrows back through earlier weeks, the current
   plan, and recent point movements. Read only; no store, no code redemption. */
import { useState } from 'preact/hooks';
import { DAYS, LINES, STUDENT_ID, TODAY, WEEKS, key, pastMoves, plan, ui } from '../../data/halqah';
import { AttChip, DayPicker, LinesView, Mark, More, Num } from './parts';
import { ar, balance, circleById, earned, isFuture, studentById, type State } from './store';

const S = ui.student;

export function StudentView({ entries }: { entries: State['entries'] }) {
  const me = studentById(STUDENT_ID);
  const circle = circleById(me.circle);
  const [week, setWeek] = useState(0);
  const [day, setDay] = useState(TODAY);
  const [allMoves, setAllMoves] = useState(false);
  const e = entries[key(week, day, me.id)];
  const future = isFuture(week, day);
  const note = e && LINES.map((k) => e.lines[k].note).find(Boolean);

  const moves: { label: string; when: string; delta: number }[] = [];
  for (let w = 0; w < WEEKS.length; w++) {
    for (let d = DAYS.length - 1; d >= 0; d--) {
      const x = entries[key(w, d, me.id)];
      if (!x) continue;
      moves.push({ label: x.att === 'absent' ? S.absentMove : S.dayMove, when: `${DAYS[d]}، ${WEEKS[w]}`, delta: earned(x) });
    }
  }
  const recent = [...moves.slice(0, 4), ...pastMoves];

  const turn = (w: number) => {
    setWeek(w);
    setDay(w === 0 ? TODAY : DAYS.length - 1);
  };

  return (
    <div class="hq-student">
      <section class="hq-me" aria-labelledby="hq-me">
        <div>
          <h3 class="hq-h" id="hq-me">{S.hello} {me.name.split(' ')[0]}</h3>
          <p class="hq-sub">{circle.name}، {circle.teacher}</p>
          <p class="hq-me__level">{ui.tracks[me.track]}، {ui.level} {ar(me.level)}</p>
        </div>
        <p class="hq-balance">
          <span class="hq-balance__label">{S.balance}</span>
          <span class="hq-balance__num"><Num n={balance(entries, me)} /></span>
        </p>
      </section>

      <section class="hq-panel" aria-labelledby="hq-att">
        <div class="hq-weekbar">
          <button type="button" class="hq-arrow hq-arrow--back" aria-label={S.prevWeek} disabled={week === WEEKS.length - 1} onClick={() => turn(week + 1)}></button>
          <h3 class="hq-h hq-h--sm" id="hq-att">
            {S.attendance}<span class="hq-weekbar__when" aria-live="polite">{WEEKS[week]}</span>
          </h3>
          <button type="button" class="hq-arrow hq-arrow--fwd" aria-label={S.nextWeek} disabled={week === 0} onClick={() => turn(week - 1)}></button>
        </div>
        <DayPicker
          label={S.daysLabel}
          value={day}
          week={week}
          onPick={setDay}
          sub={(d) => {
            if (isFuture(week, d)) return ui.notYet;
            const x = entries[key(week, d, me.id)];
            return x ? ui.att[x.att] : ui.notRecorded;
          }}
          subShort={(d) => {
            if (isFuture(week, d)) return <Mark label={ui.notYet} empty />;
            const x = entries[key(week, d, me.id)];
            return x ? ui.att[x.att] : <Mark label={ui.notRecorded} empty />;
          }}
        />
        <div class="hq-dayview hq-enter" key={`${week}:${day}`}>
          {future ? (
            <p class="hq-empty">{S.future}</p>
          ) : !e ? (
            <p class="hq-empty">{S.nothing}</p>
          ) : (
            <>
              <div class="hq-row__top">
                <span class="hq-row__name">{week === 0 && day === TODAY ? ui.today : DAYS[day]}</span>
                <AttChip att={e.att} />
              </div>
              <LinesView entry={e} />
              {note && (
                <p class="hq-note">
                  <span class="hq-note__label">{S.teacherNote}</span> {note}
                </p>
              )}
            </>
          )}
        </div>
      </section>

      <div class="hq-two">
        <section class="hq-panel" aria-labelledby="hq-plan">
          <h3 class="hq-h hq-h--sm" id="hq-plan">{S.plan}</h3>
          <p class="hq-sub">{ui.tracks[plan.track]}، {ui.level} {ar(plan.level)}، {S.planDay} {ar(plan.day)} {ui.admin.of} {ar(plan.of)}</p>
          <ol class="hq-plan" aria-hidden="true">
            {Array.from({ length: plan.of }, (_, i) => (
              <li key={i} class={`${i < plan.day - 1 ? 'is-done' : ''}${i === plan.day - 1 ? ' is-now' : ''}${plan.exams.includes(i + 1) ? ' is-exam' : ''}`}></li>
            ))}
          </ol>
          <ul class="hq-planlines">
            {LINES.map((k) => (
              <li key={k}>
                <span class="hq-line__name">{ui.lines[k]}</span>
                <span>{plan.lines[k]}</span>
              </li>
            ))}
          </ul>
          <p class="hq-muted">{S.nextExam} {ar(plan.exams[0])}</p>
        </section>

        <section class="hq-panel" aria-labelledby="hq-moves">
          <h3 class="hq-h hq-h--sm" id="hq-moves">{S.moves}</h3>
          <ul class={`hq-moves hq-clip hq-clip--3${allMoves ? ' is-all' : ''}`} id="hq-moves-list">
            {recent.map((m, i) => (
              <li key={i}>
                <span>
                  <span class="hq-moves__label">{m.label}</span>
                  <span class="hq-moves__when">{m.when}</span>
                </span>
                <span class="hq-moves__delta" dir="ltr">{m.delta > 0 ? '+' : ''}<Num n={m.delta} /></span>
              </li>
            ))}
          </ul>
          {recent.length > 3 && <More open={allMoves} onToggle={() => setAllMoves(!allMoves)} controls="hq-moves-list" />}
        </section>
      </div>
    </div>
  );
}
