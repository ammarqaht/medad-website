/* Injaz demo island (FR-24, FR-26). A participant submits text answers, a
   supervisor reviews and grades them, and the leaderboard moves with every
   grade, all on one shared in-memory store. No network, no storage, no inline
   styles (the CSP is hashed). Loaded only on /works/injaz. */
import { useEffect, useReducer, useRef, useState } from 'preact/hooks';
import { ui, type Role } from '../../data/injaz';
import { Admin } from './Admin';
import { Member } from './Member';
import { initial, reducer } from './store';
import './injaz.css';

const ROLES: Role[] = ['member', 'admin'];

export default function InjazDemo() {
  const [state, dispatch] = useReducer(reducer, undefined, () => initial());
  const [role, setRole] = useState<Role>('member');
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
    setRole('member');
    say(ui.resetDone);
    scrollTop();
  };

  return (
    <div class="ij" ref={root}>
      <div class="ij-bar">
        <span class="ij-bar__brand">{ui.brand}</span>
        <div class="ij-roles" role="group" aria-label={ui.rolesLabel}>
          {ROLES.map((r) => (
            <button type="button" key={r} class="ij-role" aria-pressed={role === r} onClick={() => choose(r)}>
              {ui.roles[r]}
            </button>
          ))}
        </div>
        <button type="button" class="ij-tool" onClick={reset}>
          <span class="ij-tool__icon" aria-hidden="true"></span>
          {ui.reset}
        </button>
      </div>
      <p class="ij-sr" aria-live="polite">{said}</p>
      <div class="ij-portal ij-enter" key={`${role}:${state.epoch}`}>
        {role === 'member' && <Member state={state} dispatch={dispatch} onSay={say} onScrollTop={scrollTop} />}
        {role === 'admin' && <Admin state={state} dispatch={dispatch} onSay={say} onScrollTop={scrollTop} />}
      </div>
    </div>
  );
}
