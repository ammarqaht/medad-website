/* Tahfeez demo island (FR-23, FR-26). A sign-up entry, a supervisor who
   approves registrations and moves points, and a student who sees the
   balance, all on one shared in-memory store. No network, no storage, no
   inline styles (the CSP is hashed). Loaded only on /works/tasyeer-tahfeez. */
import { useEffect, useReducer, useRef, useState } from 'preact/hooks';
import { ui, type Role } from '../../data/tahfeez';
import { Admin } from './Admin';
import { Join } from './Join';
import { Student } from './Student';
import { initial, reducer } from './store';
import './tahfeez.css';

const ROLES: Role[] = ['join', 'admin', 'student'];

export default function TahfeezDemo() {
  const [state, dispatch] = useReducer(reducer, undefined, () => initial());
  const [role, setRole] = useState<Role>('join');
  const [said, setSaid] = useState('');
  const sayTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(sayTimer.current), []);
  /** Clear, then set, so the same message is announced again when repeated. */
  const say = (m: string) => {
    setSaid('');
    window.clearTimeout(sayTimer.current);
    sayTimer.current = window.setTimeout(() => setSaid(m), 60);
  };
  const root = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLHeadingElement>(null);

  const scrollTop = () => {
    const screen = root.current?.closest('[data-screen]');
    if (screen) screen.scrollTop = 0;
  };

  const choose = (r: Role) => {
    setRole(r);
    say(`${ui.roleNow} ${ui.roles[r]}`);
    scrollTop();
  };

  const reset = () => {
    dispatch({ type: 'reset' });
    setRole('join');
    say(ui.resetDone);
    scrollTop();
  };

  return (
    <div class="tf" ref={root}>
      <div class="tf-bar">
        <span class="tf-bar__brand">{ui.brand}</span>
        <div class="tf-roles" role="group" aria-label={ui.rolesLabel}>
          {ROLES.map((r) => (
            <button type="button" key={r} class="tf-role" aria-pressed={role === r} onClick={() => choose(r)}>
              {ui.roles[r]}
            </button>
          ))}
        </div>
        <button type="button" class="tf-tool" onClick={reset}>
          <span class="tf-tool__icon" aria-hidden="true"></span>
          {ui.reset}
        </button>
      </div>
      <p class="tf-sr" aria-live="polite">{said}</p>
      <div class="tf-portal tf-enter" key={`${role}:${state.epoch}`}>
        {role === 'join' && <Join state={state} dispatch={dispatch} head={head} onRole={choose} onSay={say} />}
        {role === 'admin' && <Admin state={state} dispatch={dispatch} onSay={say} onScrollTop={scrollTop} />}
        {role === 'student' && <Student state={state} dispatch={dispatch} />}
      </div>
    </div>
  );
}
