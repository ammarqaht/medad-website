/* Supervisor: the registrations with their states, approve or reject the
   pending ones, and open an active member to add or deduct points with a
   reason. On phone widths the list shows three rows, then "show all". */
import { useEffect, useRef, useState } from 'preact/hooks';
import { AMOUNTS, REASONS, ui, type Status } from '../../data/tahfeez';
import { Delta, Moves, More, Num, StatusChip } from './parts';
import { ar, balance, byNo, pointsText, type Action, type State } from './store';

const A = ui.admin;
type Filter = 'all' | Status;
const FILTERS: Filter[] = ['all', 'pending', 'active', 'rejected'];

interface Props {
  state: State;
  dispatch: (a: Action) => void;
  onSay: (s: string) => void;
  onScrollTop: () => void;
}

export function Admin({ state, dispatch, onSay, onScrollTop }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<number | null>(null);
  const [all, setAll] = useState(false);
  const listHead = useRef<HTMLHeadingElement>(null);
  const returning = useRef(false);

  useEffect(() => {
    if (open === null && returning.current) {
      returning.current = false;
      listHead.current?.focus();
    }
  }, [open]);

  const member = open !== null ? byNo(state.members, open) : undefined;
  if (member) {
    return (
      <Points
        key={member.no}
        member={member}
        dispatch={dispatch}
        onSay={onSay}
        onBack={() => {
          returning.current = true;
          setOpen(null);
          onScrollTop();
        }}
      />
    );
  }

  // pending first, then the newest
  const list = state.members
    .filter((m) => filter === 'all' || m.status === filter)
    .sort((a, b) => (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1) || b.no - a.no);
  const count = (f: Filter) => state.members.filter((m) => f === 'all' || m.status === f).length;

  const decide = (no: number, ok: boolean) => {
    const m = byNo(state.members, no)!;
    dispatch({ type: 'decide', no, ok });
    onSay(ok ? A.approved(m.name) : A.rejected(m.name));
    // the clicked button leaves the DOM: keep focus inside the list
    requestAnimationFrame(() => listHead.current?.focus());
  };

  return (
    <section class="tf-admin" aria-labelledby="tf-admin-h">
      <h3 class="tf-h" id="tf-admin-h" tabIndex={-1} ref={listHead}>{A.title}</h3>
      <div class="tf-filters" role="group" aria-label={A.filtersLabel}>
        {FILTERS.map((f) => (
          <button type="button" key={f} class="tf-chip" aria-pressed={filter === f} onClick={() => { setFilter(f); setAll(false); }}>
            {f === 'all' ? A.all : ui.status[f]} <span class="tf-chip__n"><Num n={count(f)} /></span>
          </button>
        ))}
      </div>
      {list.length ? (
        <ul class={`tf-rows${all ? ' is-all' : ''}`} id="tf-rows">
          {list.map((m) => (
            <li class={`tf-row tf-row--${m.status}`} key={m.no}>
              <div class="tf-row__who">
                <span class="tf-row__name">{m.name}</span>
                <span class="tf-row__meta">{A.no} <Num n={m.no} />، {m.stage}</span>
              </div>
              <StatusChip status={m.status} />
              {m.status === 'pending' && (
                <div class="tf-row__acts">
                  <button type="button" class="tf-btn tf-btn--sm" onClick={() => decide(m.no, true)}>
                    {A.approve}<span class="tf-sr"> {m.name}</span>
                  </button>
                  <button type="button" class="tf-btn tf-btn--sm tf-btn--plain" onClick={() => decide(m.no, false)}>
                    {A.reject}<span class="tf-sr"> {m.name}</span>
                  </button>
                </div>
              )}
              {m.status === 'active' && (
                <div class="tf-row__acts">
                  <span class="tf-row__pts"><Num n={balance(m)} /> <small>{ui.points}</small></span>
                  <button type="button" class="tf-btn tf-btn--sm" onClick={() => { setOpen(m.no); onScrollTop(); }}>
                    {A.points}<span class="tf-sr"> {m.name}</span>
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p class="tf-empty">{A.empty}</p>
      )}
      <More open={all} onToggle={() => setAll(!all)} controls="tf-rows" count={list.length} />
    </section>
  );
}

interface PointsProps {
  member: NonNullable<ReturnType<typeof byNo>>;
  dispatch: (a: Action) => void;
  onSay: (s: string) => void;
  onBack: () => void;
}

function Points({ member, dispatch, onSay, onBack }: PointsProps) {
  const [amount, setAmount] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [all, setAll] = useState(false);
  const head = useRef<HTMLHeadingElement>(null);
  const firstAmount = useRef<HTMLInputElement>(null);
  const reasonRef = useRef<HTMLInputElement>(null);
  useEffect(() => head.current?.focus(), []);
  const total = balance(member);

  const save = (ev: Event) => {
    ev.preventDefault();
    if (amount === null) {
      setError(A.needAmount);
      firstAmount.current?.focus();
      return;
    }
    if (!reason.trim()) {
      setError(A.needReason);
      reasonRef.current?.focus();
      return;
    }
    if (total + amount < 0) {
      setError(A.tooMuch);
      return;
    }
    dispatch({ type: 'move', no: member.no, delta: amount, reason: reason.trim() });
    const sign = amount < 0 ? 'خصم' : 'إضافة';
    onSay(A.saved(`${sign} ${pointsText(amount)}`, member.name, ar(total + amount)));
    setAmount(null);
    setReason('');
    setError('');
  };

  return (
    <section class="tf-points" aria-labelledby="tf-pts-h">
      <button type="button" class="tf-back" onClick={onBack}>{A.back}</button>
      <div class="tf-card tf-points__head">
        <div>
          <h3 class="tf-h" id="tf-pts-h" tabIndex={-1} ref={head}>{member.name}</h3>
          <p class="tf-row__meta">{A.no} <Num n={member.no} />، {member.stage}</p>
        </div>
        <div class="tf-bal tf-bal--sm">
          <span class="tf-bal__label">{A.balance}</span>
          <span class="tf-bal__num"><Num n={total} /></span>
        </div>
      </div>

      <form class="tf-card tf-form" noValidate onSubmit={save}>
        <fieldset class="tf-group">
          <legend>{A.amountLabel}</legend>
          <div class="tf-opts tf-opts--amounts">
            {AMOUNTS.map((n, i) => (
              <label class={`tf-opt${n < 0 ? ' is-down' : ''}`} key={n}>
                <input
                  type="radio"
                  name="tf-amount"
                  ref={i === 0 ? firstAmount : undefined}
                  checked={amount === n}
                  onChange={() => { setAmount(n); setError(''); }}
                />
                <span><Delta n={n} /></span>
              </label>
            ))}
          </div>
        </fieldset>
        <div class="tf-field">
          <label for="tf-reason">{A.reason}</label>
          <input
            id="tf-reason"
            ref={reasonRef}
            type="text"
            autoComplete="off"
            maxLength={40}
            placeholder={A.reasonPh}
            value={reason}
            onInput={(e) => { setReason((e.currentTarget as HTMLInputElement).value); setError(''); }}
          />
        </div>
        <div class="tf-suggest" role="group" aria-label={A.reasonsLabel}>
          {REASONS.map((r) => (
            <button type="button" key={r} class="tf-chip tf-chip--s" onClick={() => { setReason(r); setError(''); }}>{r}</button>
          ))}
        </div>
        <div class="tf-alert-slot" role="alert">{error && <p class="tf-err">{error}</p>}</div>
        <button type="submit" class="tf-btn tf-btn--go">{A.save}</button>
      </form>

      <section class="tf-card" aria-labelledby="tf-pts-moves">
        <h4 class="tf-h tf-h--sm" id="tf-pts-moves">{A.moves}</h4>
        <div class={`tf-clip${all ? ' is-all' : ''}`}>
          <Moves moves={member.moves} id="tf-pts-list" empty={A.noMoves} />
        </div>
        <More open={all} onToggle={() => setAll(!all)} controls="tf-pts-list" count={member.moves.length} />
      </section>
    </section>
  );
}
