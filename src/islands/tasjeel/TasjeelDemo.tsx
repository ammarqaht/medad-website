/* Tasjeel demo island (FR-22, FR-26). Three steps of a registration site:
   the club intro, a form with Arabic validation, and a confirmation with a
   locally made membership number. Mobile first: it lives in a phone frame.
   No network, no storage, no inline styles (the CSP is hashed). Loaded only
   on /works/tasyeer-tasjeel. */
import { useEffect, useRef, useState } from 'preact/hooks';
import { STEPS, ui, type Step } from '../../data/tasjeel';
import { ar, initial, nextMember, type State } from './store';
import { RegForm } from './RegForm';
import './tasjeel.css';

export default function TasjeelDemo() {
  const [state, setState] = useState<State>(initial);
  const [said, setSaid] = useState('');
  const sayTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(sayTimer.current), []);
  /** Clear, then set, so the same message is announced again when repeated. */
  const say = (m: string) => {
    setSaid('');
    window.clearTimeout(sayTimer.current);
    sayTimer.current = window.setTimeout(() => setSaid(m), 60);
  };
  const [epoch, setEpoch] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  const scrollTop = () => {
    const screen = root.current?.closest('[data-screen]');
    if (screen) screen.scrollTop = 0;
  };

  // focus follows the step so keyboard and screen reader users land on what changed
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    scrollTop();
    head.current?.focus();
  }, [state.step, epoch]);

  const go = (step: Step, patch: Partial<State> = {}) => {
    moved.current = true;
    setState((s) => ({ ...s, ...patch, step }));
  };

  const reset = () => {
    setState(initial());
    setEpoch((e) => e + 1);
    say(ui.resetDone);
    scrollTop();
  };

  const submit = (first: string) => {
    const member = nextMember(state.issued);
    go('done', { issued: state.issued + 1, member, first });
    // the heading takes focus and reads «تم التسجيل»; the live region adds only the number
    say(ui.done.said(ar(member)));
  };

  const D = ui.done;
  const I = ui.intro;
  const at = STEPS.indexOf(state.step);

  return (
    <div class="tj" ref={root}>
      <div class="tj-bar">
        <span class="tj-bar__brand">{ui.brand}</span>
        <button type="button" class="tj-tool" onClick={reset}>
          <span class="tj-tool__icon" aria-hidden="true"></span>
          {ui.reset}
        </button>
      </div>
      <p class="tj-sr" aria-live="polite">{said}</p>

      <ol class="tj-steps" aria-label={ui.stepsLabel}>
        {STEPS.map((s, i) => (
          <li
            key={s}
            class={`tj-step${i < at ? ' is-past' : ''}${i === at ? ' is-now' : ''}`}
            aria-current={i === at ? 'step' : undefined}
          >
            {ui.steps[s]}
          </li>
        ))}
      </ol>

      <div class="tj-page tj-enter" key={`${state.step}:${epoch}:${state.issued}`}>
        {state.step === 'intro' && (
          <section class="tj-intro" aria-labelledby="tj-h">
            <h3 class="tj-h tj-h--xl" id="tj-h" tabIndex={-1} ref={head}>{I.title}</h3>
            <p class="tj-lead">{I.line}</p>
            <dl class="tj-details" aria-label={I.detailsLabel}>
              {I.details.map((d) => (
                <div class="tj-details__row" key={d.k}>
                  <dt>{d.k}</dt>
                  <dd>{d.v}</dd>
                </div>
              ))}
            </dl>
            <button type="button" class="tj-btn tj-btn--go" onClick={() => go('form')}>{I.cta}</button>
          </section>
        )}

        {state.step === 'form' && (
          <RegForm head={head} onBack={() => go('intro')} onDone={submit} onSay={say} />
        )}

        {state.step === 'done' && (
          <section class="tj-done" aria-labelledby="tj-h">
            <h3 class="tj-h" id="tj-h" tabIndex={-1} ref={head}>{D.title}</h3>
            <p class="tj-lead">{D.hello(state.first)}</p>
            <div class="tj-member">
              <span class="tj-member__label">{D.number}</span>
              <span class="tj-member__num">{ar(state.member)}</span>
            </div>
            <section class="tj-notices" aria-labelledby="tj-notices">
              <h4 class="tj-h tj-h--sm" id="tj-notices">{D.noticesTitle}</h4>
              <ul>
                {D.notices.map((n) => <li key={n}>{n}</li>)}
              </ul>
            </section>
            <div class="tj-actions">
              <button type="button" class="tj-btn" onClick={() => go('form')}>{D.another}</button>
              <button type="button" class="tj-btn tj-btn--plain" onClick={() => go('intro')}>{D.home}</button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
