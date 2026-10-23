/* The entry: a short intro and a sign-up form with few fields. Sending it
   issues the next membership number at once, and the registration waits in
   the supervisor's list as "pending". The ID is checked for shape only and
   never kept. */
import type { RefObject } from 'preact';
import { useRef, useState } from 'preact/hooks';
import { STAGES, ui, type Role } from '../../data/tahfeez';
import { Num } from './parts';
import { ar, latin, nextNo, type Action, type State } from './store';

const J = ui.join;
type Field = 'name' | 'nid' | 'stage';
const ARABIC = /^[ء-يـ\s]+$/;

interface Props {
  state: State;
  dispatch: (a: Action) => void;
  head: RefObject<HTMLHeadingElement | null>;
  onRole: (r: Role) => void;
  onSay: (s: string) => void;
}

export function Join({ state, dispatch, head, onRole, onSay }: Props) {
  const [name, setName] = useState('');
  const [nid, setNid] = useState('');
  const [stage, setStage] = useState('');
  const [tried, setTried] = useState(false);
  const [done, setDone] = useState(0);
  const refs = useRef<Partial<Record<Field, HTMLInputElement | null>>>({});
  const doneHead = useRef<HTMLHeadingElement>(null);

  const check = (v = { name, nid, stage }) => {
    const e: Partial<Record<Field, string>> = {};
    const n = v.name.trim();
    if (!n || !ARABIC.test(n) || n.split(/\s+/).length < 3) e.name = J.errors.name;
    if (!/^[12]\d{9}$/.test(latin(v.nid).replace(/\s/g, ''))) e.nid = J.errors.nid;
    if (!v.stage) e.stage = J.errors.stage;
    return e;
  };
  const errors = tried ? check() : {};

  const submit = (ev: Event) => {
    ev.preventDefault();
    setTried(true);
    const e = check();
    const first = (['name', 'nid', 'stage'] as Field[]).find((k) => e[k]);
    if (first) {
      onSay(J.errorsSaid);
      refs.current[first]?.focus();
      return;
    }
    const no = nextNo(state.members);
    dispatch({ type: 'register', name: name.trim(), stage });
    setDone(no);
    onSay(J.said(ar(no)));
    requestAnimationFrame(() => doneHead.current?.focus());
  };

  const again = () => {
    setName('');
    setNid('');
    setStage('');
    setTried(false);
    setDone(0);
    requestAnimationFrame(() => head.current?.focus());
  };

  const fill = () => {
    setName('بدر نايف سالم');
    setNid('٢٢٢٢٢٢٢٢٢٢');
    setStage(STAGES[1]);
    onSay(J.filled);
  };

  if (done) {
    return (
      <section class="tf-card tf-done" aria-labelledby="tf-done-h">
        <h3 class="tf-h" id="tf-done-h" tabIndex={-1} ref={doneHead}>{J.doneTitle}</h3>
        <div class="tf-no">
          <span class="tf-no__label">{J.doneNo}</span>
          <span class="tf-no__num"><Num n={done} /></span>
        </div>
        <p class="tf-done__line"><span class="tf-status tf-status--pending">{ui.status.pending}</span> {J.doneLine}</p>
        <div class="tf-actions">
          <button type="button" class="tf-btn" onClick={() => onRole('admin')}>{J.toAdmin}</button>
          <button type="button" class="tf-btn tf-btn--plain" onClick={() => onRole('student')}>{J.toStudent}</button>
          <button type="button" class="tf-btn tf-btn--plain" onClick={again}>{J.again}</button>
        </div>
      </section>
    );
  }

  const bad = (k: Field) => (errors[k] ? { 'aria-invalid': 'true' as const, 'aria-describedby': `tf-${k}-err` } : {});
  const msg = (k: Field) =>
    (errors[k] ? <p class="tf-err" id={`tf-${k}-err`}>{errors[k]}</p> : null);

  return (
    <section class="tf-join" aria-labelledby="tf-join-h">
      <div class="tf-join__intro">
        <h3 class="tf-h" id="tf-join-h" tabIndex={-1} ref={head}>{J.title}</h3>
        <p class="tf-lead">{J.line}</p>
      </div>
      <form class="tf-card tf-form" noValidate onSubmit={submit}>
        <div class="tf-form__head">
          <p class="tf-demo">{J.demo}</p>
          <button type="button" class="tf-chip" onClick={fill}>{J.fill}</button>
        </div>
        <div class="tf-pair">
          <div class={`tf-field${errors.name ? ' is-bad' : ''}`}>
            <label for="tf-name">{J.name}</label>
            <input
              id="tf-name"
              ref={(el) => { refs.current.name = el; }}
              type="text"
              autoComplete="off"
              maxLength={50}
              placeholder={J.namePh}
              value={name}
              onInput={(e) => setName((e.currentTarget as HTMLInputElement).value)}
              {...bad('name')}
            />
            {msg('name')}
          </div>
          <div class={`tf-field${errors.nid ? ' is-bad' : ''}`}>
            <label for="tf-nid">{J.nid}</label>
            <input
              id="tf-nid"
              ref={(el) => { refs.current.nid = el; }}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={12}
              placeholder={J.nidPh}
              value={nid}
              onInput={(e) => setNid((e.currentTarget as HTMLInputElement).value)}
              {...bad('nid')}
            />
            {msg('nid')}
          </div>
        </div>
        <fieldset class={`tf-group${errors.stage ? ' is-bad' : ''}`} aria-describedby={errors.stage ? 'tf-stage-err' : undefined}>
          <legend>{J.stage}</legend>
          <div class="tf-opts">
            {STAGES.map((s, i) => (
              <label class="tf-opt" key={s}>
                <input
                  type="radio"
                  name="tf-stage"
                  ref={i === 0 ? (el) => { refs.current.stage = el; } : undefined}
                  checked={stage === s}
                  onChange={() => setStage(s)}
                />
                <span>{s}</span>
              </label>
            ))}
          </div>
          {msg('stage')}
        </fieldset>
        <button type="submit" class="tf-btn tf-btn--go">{J.submit}</button>
      </form>
    </section>
  );
}
