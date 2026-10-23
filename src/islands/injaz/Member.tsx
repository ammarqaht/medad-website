/* Participant: points and rank on top, the tasks with their states, a task
   page to submit a text answer (or send it again after a redo request), and
   the leaderboard. */
import { useEffect, useRef, useState } from 'preact/hooks';
import { ME, subKey, tasks, ui, type Task } from '../../data/injaz';
import { Board, More, Num, StatusChip } from './parts';
import { personById, pointsText, standings, type Action, type State } from './store';

const M = ui.member;
type Tab = 'tasks' | 'board';

interface Props {
  state: State;
  dispatch: (a: Action) => void;
  onSay: (s: string) => void;
  onScrollTop: () => void;
}

export function Member({ state, dispatch, onSay, onScrollTop }: Props) {
  const [tab, setTab] = useState<Tab>('tasks');
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

  const me = standings(state.subs).find((r) => r.person.id === ME)!;
  const go = (t: Tab) => {
    setTab(t);
    setOpen(null);
    onScrollTop();
  };

  return (
    <div class="ij-member">
      <div class="ij-card ij-me">
        <h3 class="ij-h ij-me__name">{M.hello} {personById(ME).name}</h3>
        <dl class="ij-me__stats">
          <div class="ij-stat">
            <dt>{M.myPoints}</dt>
            <dd><Num n={me.points} /></dd>
          </div>
          <div class="ij-stat ij-stat--ink">
            <dt>{M.myRank}</dt>
            <dd><Num n={me.rank} /></dd>
          </div>
        </dl>
      </div>

      <nav class="ij-tabs" aria-label={M.tabsLabel}>
        {(['tasks', 'board'] as Tab[]).map((t) => (
          <button type="button" key={t} class="ij-tab" aria-current={tab === t ? 'page' : undefined} onClick={() => go(t)}>
            {M.tabs[t]}
          </button>
        ))}
      </nav>

      <div class="ij-enter" key={`${tab}:${open ?? ''}`}>
        {tab === 'board' && <Board subs={state.subs} />}
        {tab === 'tasks' &&
          (open ? (
            <TaskPage
              task={tasks.find((t) => t.id === open)!}
              state={state}
              dispatch={dispatch}
              onSay={onSay}
              onBack={() => {
                back.current = true;
                setOpen(null);
                onScrollTop();
              }}
            />
          ) : (
            <section class="ij-card" aria-labelledby="ij-tasks-h">
              <h3 class="ij-h" id="ij-tasks-h" tabIndex={-1} ref={listHead}>{M.tasksTitle}</h3>
              <ul class={`ij-list${all ? ' is-all' : ''}`} id="ij-tasks">
                {tasks.map((t) => {
                  const s = state.subs[subKey(ME, t.id)];
                  return (
                    <li class="ij-item" key={t.id}>
                      <button type="button" class="ij-item__btn" onClick={() => { setOpen(t.id); onScrollTop(); }}>
                        <span class="ij-item__title">{t.title}</span>
                        <span class="ij-item__meta">
                          <StatusChip status={s?.status ?? 'none'} />
                          <span class="ij-item__pts">
                            {s?.status === 'approved' ? (
                              <><Num n={s.grade} /> {ui.of} <Num n={t.max} /></>
                            ) : (
                              <>{M.maxPts} <Num n={t.max} /></>
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <More open={all} onToggle={() => setAll(!all)} controls="ij-tasks" count={tasks.length} />
            </section>
          ))}
      </div>
    </div>
  );
}

interface TaskProps {
  task: Task;
  state: State;
  dispatch: (a: Action) => void;
  onSay: (s: string) => void;
  onBack: () => void;
}

function TaskPage({ task, state, dispatch, onSay, onBack }: TaskProps) {
  const sub = state.subs[subKey(ME, task.id)];
  const canSend = !sub || sub.status === 'returned';
  const [text, setText] = useState(sub?.status === 'returned' ? sub.text : '');
  const [error, setError] = useState('');
  const head = useRef<HTMLHeadingElement>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  useEffect(() => head.current?.focus(), []);

  const send = (ev: Event) => {
    ev.preventDefault();
    if (text.trim().length < 15) {
      setError(M.short);
      area.current?.focus();
      return;
    }
    const again = !!sub;
    dispatch({ type: 'submit', person: ME, task: task.id, text: text.trim() });
    setError('');
    onSay(again ? M.resent(task.title) : M.sent(task.title));
    head.current?.focus();
  };

  return (
    <section class="ij-task" aria-labelledby="ij-task-h">
      <button type="button" class="ij-back" onClick={onBack}>{M.back}</button>
      <div class="ij-card">
        <div class="ij-task__top">
          <h3 class="ij-h" id="ij-task-h" tabIndex={-1} ref={head}>{task.title}</h3>
          <StatusChip status={sub?.status ?? 'none'} />
        </div>
        <p>{task.brief}</p>
        <p class="ij-muted">{M.maxPts} {pointsText(task.max)}، {task.due}</p>
      </div>

      {sub && (
        <div class="ij-card">
          {sub.status === 'approved' && (
            <p class="ij-grade">
              <span class="ij-grade__label">{M.grade}</span>
              <span class="ij-grade__num"><Num n={sub.grade} /> <small>{ui.of} <Num n={task.max} /></small></span>
            </p>
          )}
          {sub.feedback && (
            <p class="ij-fb"><span class="ij-fb__label">{M.feedback}: </span>{sub.feedback}</p>
          )}
          {sub.status !== 'returned' && (
            <div class="ij-answer">
              <span class="ij-answer__label">{M.yourAnswer}</span>
              <p>{sub.text}</p>
            </div>
          )}
          {sub.status === 'pending' && <p class="ij-muted">{M.locked}</p>}
        </div>
      )}

      {canSend && (
        <form class="ij-card ij-form" noValidate onSubmit={send}>
          <p class="ij-demo">{M.demo}</p>
          <div class="ij-field">
            <label for="ij-answer">{M.answer}</label>
            <textarea
              id="ij-answer"
              ref={area}
              rows={4}
              maxLength={400}
              autoComplete="off"
              placeholder={M.answerPh}
              value={text}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={error ? 'ij-answer-err' : undefined}
              onInput={(e) => { setText((e.currentTarget as HTMLTextAreaElement).value); setError(''); }}
            />
            {error && <p class="ij-err" id="ij-answer-err" role="alert">{error}</p>}
          </div>
          <button type="submit" class="ij-btn ij-btn--go">{sub ? M.resend : M.send}</button>
        </form>
      )}
    </section>
  );
}
