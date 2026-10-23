/* Student page: the balance and the latest point moves of an active member,
   or a waiting note while the registration is pending. "Enter as" stands in
   for signing in with the membership number (no real sign-in in the demo). */
import { useState } from 'preact/hooks';
import { DEFAULT_STUDENT, FIRST_NO, seedMembers, ui } from '../../data/tahfeez';
import { Moves, More, Num } from './parts';
import { ar, balance, byNo, pointsText, type Action, type State } from './store';

const S = ui.student;
/** A pending member from the seed, so the waiting page can be seen without signing up. */
const SEED_PENDING = seedMembers().find((m) => m.status === 'pending')!.no;
const SEED_LAST = FIRST_NO + seedMembers().length - 1;

export function Student({ state, dispatch }: { state: State; dispatch: (a: Action) => void }) {
  const [all, setAll] = useState(false);
  const who = [DEFAULT_STUDENT, SEED_PENDING, ...state.members.filter((m) => m.no > SEED_LAST).map((m) => m.no)];
  const me = byNo(state.members, state.viewAs) ?? byNo(state.members, DEFAULT_STUDENT)!;
  const total = balance(me);

  return (
    <section class="tf-student" aria-labelledby="tf-st-h">
      <div class="tf-who" role="group" aria-label={S.whoLabel}>
        <span class="tf-who__label" aria-hidden="true">{S.whoLabel}</span>
        {who.map((no) => (
          <button type="button" key={no} class="tf-chip tf-chip--s" aria-pressed={me.no === no} onClick={() => dispatch({ type: 'view', no })}>
            {ar(no)}
          </button>
        ))}
      </div>

      <div class="tf-card tf-me">
        <div>
          <h3 class="tf-h" id="tf-st-h">{S.hello} {me.name}</h3>
          <p class="tf-row__meta">{ui.admin.no} {ar(me.no)}، {me.stage}</p>
        </div>
        {me.status === 'active' && (
          <div class="tf-bal" aria-label={`${S.balance}: ${pointsText(total)}`}>
            <span class="tf-bal__label" aria-hidden="true">{S.balance}</span>
            <span class="tf-bal__num" aria-hidden="true"><Num n={total} /></span>
          </div>
        )}
      </div>

      {me.status === 'active' && (
        <section class="tf-card" aria-labelledby="tf-st-moves">
          <h4 class="tf-h tf-h--sm" id="tf-st-moves">{S.moves}</h4>
          <div class={`tf-clip${all ? ' is-all' : ''}`}>
            <Moves moves={me.moves} id="tf-st-list" empty={S.noMoves} />
          </div>
          <More open={all} onToggle={() => setAll(!all)} controls="tf-st-list" count={me.moves.length} />
        </section>
      )}
      {me.status === 'pending' && (
        <section class="tf-card tf-wait" aria-labelledby="tf-st-wait">
          <h4 class="tf-h tf-h--sm" id="tf-st-wait">{S.pendingTitle}</h4>
          <p>{S.pendingLine}</p>
        </section>
      )}
      {me.status === 'rejected' && (
        <section class="tf-card tf-wait" aria-labelledby="tf-st-rej">
          <h4 class="tf-h tf-h--sm" id="tf-st-rej">{S.rejectedTitle}</h4>
          <p>{S.rejectedLine}</p>
        </section>
      )}
    </section>
  );
}
