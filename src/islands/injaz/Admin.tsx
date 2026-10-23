/* Supervisor: the submissions queue by state, a review page to grade and
   accept a submission or ask for a redo with a note, and the leaderboard. */
import { useEffect, useRef, useState } from 'preact/hooks';
import { tasks, ui, type SubStatus } from '../../data/injaz';
import { Board, More, Num, StatusChip } from './parts';
import { ar, personById, taskById, type Action, type State } from './store';

const A = ui.admin;
type Tab = 'queue' | 'board';
const FILTERS: SubStatus[] = ['pending', 'approved', 'returned'];

interface Props {
  state: State;
  dispatch: (a: Action) => void;
  onSay: (s: string) => void;
  onScrollTop: () => void;
}

export function Admin({ state, dispatch, onSay, onScrollTop }: Props) {
  const [tab, setTab] = useState<Tab>('queue');
  const [filter, setFilter] = useState<SubStatus>('pending');
  const [open, setOpen] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  const listHead = useRef<HTMLHeadingElement>(null);
  const back = useRef(false);
  useEffect(() => {
    if (open === null && back.current) {
      back.current = false;
      listHead.current?.focus();
    }
  }, [open]);

  const entries = Object.entries(state.subs);
  // queue order: task order, then participant
  const order = (k: string) => {
    const [p, t] = k.split(':');
    return tasks.findIndex((x) => x.id === t) * 100 + Number(p.slice(1));
  };
  const list = entries.filter(([, s]) => s.status === filter).sort(([a], [b]) => order(a) - order(b));
  const count = (f: SubStatus) => entries.filter(([, s]) => s.status === f).length;

  const close = () => {
    back.current = true;
    setOpen(null);
    onScrollTop();
  };
  const go = (t: Tab) => {
    setTab(t);
    setOpen(null);
    onScrollTop();
  };

  return (
    <div class="ij-admin">
      <nav class="ij-tabs" aria-label={A.tabsLabel}>
        {(['queue', 'board'] as Tab[]).map((t) => (
          <button type="button" key={t} class="ij-tab" aria-current={tab === t ? 'page' : undefined} onClick={() => go(t)}>
            {A.tabs[t]}
          </button>
        ))}
      </nav>
      <div class="ij-enter" key={`${tab}:${open ?? ''}`}>
        {tab === 'board' && <Board subs={state.subs} mine={false} />}
        {tab === 'queue' &&
          (open && state.subs[open] ? (
            <Review k={open} state={state} dispatch={dispatch} onSay={onSay} onDone={close} />
          ) : (
            <section class="ij-card" aria-labelledby="ij-queue-h">
              <h3 class="ij-h" id="ij-queue-h" tabIndex={-1} ref={listHead}>{A.title}</h3>
              <div class="ij-filters" role="group" aria-label={A.filtersLabel}>
                {FILTERS.map((f) => (
                  <button type="button" key={f} class="ij-chip" aria-pressed={filter === f} onClick={() => { setFilter(f); setAll(false); }}>
                    {ui.status[f]} <span class="ij-chip__n"><Num n={count(f)} /></span>
                  </button>
                ))}
              </div>
              {list.length ? (
                <ul class={`ij-list${all ? ' is-all' : ''}`} id="ij-queue">
                  {list.map(([k, s]) => {
                    const [p, t] = k.split(':');
                    const person = personById(p);
                    const task = taskById(t);
                    return (
                      <li class="ij-sub" key={k}>
                        <div class="ij-sub__who">
                          <span class="ij-sub__name">{person.name}</span>
                          <span class="ij-sub__task">{task.title}</span>
                        </div>
                        {s.status === 'approved' ? (
                          <span class="ij-sub__grade"><Num n={s.grade} /> <small>{ui.of} <Num n={task.max} /></small></span>
                        ) : s.status === 'pending' ? (
                          <button type="button" class="ij-btn ij-btn--sm" onClick={() => { setOpen(k); onScrollTop(); }}>
                            {A.review}<span class="ij-sr"> {person.name}، {task.title}</span>
                          </button>
                        ) : (
                          <StatusChip status={s.status} />
                        )}
                        <p class="ij-sub__text">{s.text}</p>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p class="ij-empty">{A.empty}</p>
              )}
              <More open={all} onToggle={() => setAll(!all)} controls="ij-queue" count={list.length} />
            </section>
          ))}
      </div>
    </div>
  );
}

interface ReviewProps {
  k: string;
  state: State;
  dispatch: (a: Action) => void;
  onSay: (s: string) => void;
  onDone: () => void;
}

function Review({ k, state, dispatch, onSay, onDone }: ReviewProps) {
  const s = state.subs[k];
  const [p, t] = k.split(':');
  const person = personById(p);
  const task = taskById(t);
  const [grade, setGrade] = useState(task.max - 3);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const head = useRef<HTMLHeadingElement>(null);
  const fb = useRef<HTMLTextAreaElement>(null);
  useEffect(() => head.current?.focus(), []);

  const accept = () => {
    dispatch({ type: 'review', key: k, ok: true, grade, feedback: feedback.trim() });
    onSay(A.accepted(person.name, `${ar(grade)} ${ui.of} ${ar(task.max)}`));
    onDone();
  };
  const redo = () => {
    if (!feedback.trim()) {
      setError(A.needFeedback);
      fb.current?.focus();
      return;
    }
    dispatch({ type: 'review', key: k, ok: false, grade: 0, feedback: feedback.trim() });
    onSay(A.returned(person.name));
    onDone();
  };

  return (
    <section class="ij-task" aria-labelledby="ij-rev-h">
      <button type="button" class="ij-back" onClick={onDone}>{A.back}</button>
      <div class="ij-card">
        <div class="ij-task__top">
          <h3 class="ij-h" id="ij-rev-h" tabIndex={-1} ref={head}>{person.name}</h3>
          <StatusChip status={s.status} />
        </div>
        <p class="ij-muted">{task.title}</p>
        <div class="ij-answer">
          <span class="ij-answer__label">{A.answer}</span>
          <p>{s.text}</p>
        </div>
      </div>
      <div class="ij-card ij-form">
        <div class="ij-stepper" role="group" aria-labelledby="ij-grade-l">
          <span class="ij-stepper__label" id="ij-grade-l">{A.grade}</span>
          <button type="button" class="ij-stepper__btn" aria-label={A.less} aria-disabled={grade <= 0 ? 'true' : undefined} onClick={() => grade > 0 && setGrade(grade - 1)}>
            <span class="ij-minus" aria-hidden="true"></span>
          </button>
          <output class="ij-stepper__val" aria-live="polite"><Num n={grade} /></output>
          <button type="button" class="ij-stepper__btn" aria-label={A.more} aria-disabled={grade >= task.max ? 'true' : undefined} onClick={() => grade < task.max && setGrade(grade + 1)}>
            <span class="ij-plus" aria-hidden="true"></span>
          </button>
          <span class="ij-stepper__of">{ui.of} <Num n={task.max} /></span>
        </div>
        <div class="ij-field">
          <label for="ij-fb">{A.feedback}</label>
          <textarea
            id="ij-fb"
            ref={fb}
            rows={2}
            maxLength={200}
            autoComplete="off"
            placeholder={A.feedbackPh}
            value={feedback}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? 'ij-fb-err' : undefined}
            onInput={(e) => { setFeedback((e.currentTarget as HTMLTextAreaElement).value); setError(''); }}
          />
          {error && <p class="ij-err" id="ij-fb-err" role="alert">{error}</p>}
        </div>
        <div class="ij-actions">
          <button type="button" class="ij-btn ij-btn--go" onClick={accept}>{A.accept}</button>
          <button type="button" class="ij-btn ij-btn--plain" onClick={redo}>{A.redo}</button>
        </div>
      </div>
    </section>
  );
}
