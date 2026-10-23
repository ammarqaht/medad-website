/* Halqah demo island (FR-15 to FR-18, FR-26). One shared in-memory store,
   three portals behind a role switcher, and a reset. No network, no storage,
   no inline styles (the CSP is hashed). Loaded only on /works/halqah. */
import { useReducer, useRef, useState } from 'preact/hooks';
import { ui, type Role } from '../../data/halqah';
import { Supervisor } from './Supervisor';
import { Teacher } from './Teacher';
import { StudentView } from './StudentView';
import { initial, reducer } from './store';
import './halqah.css';

const ROLES: Role[] = ['admin', 'teacher', 'student'];

export default function HalqahDemo() {
  const [state, dispatch] = useReducer(reducer, undefined, () => initial());
  const [role, setRole] = useState<Role>('admin');
  const [said, setSaid] = useState('');
  const root = useRef<HTMLDivElement>(null);

  const scrollTop = () => {
    const screen = root.current?.closest('[data-screen]');
    if (screen) screen.scrollTop = 0;
  };

  const choose = (r: Role) => {
    setRole(r);
    setSaid(`${ui.roleNow} ${ui.roles[r]}`);
    scrollTop();
  };

  const reset = () => {
    dispatch({ type: 'reset' });
    setRole('admin');
    setSaid(ui.resetDone);
    scrollTop();
  };

  return (
    <div class="hq" ref={root}>
      <div class="hq-bar">
        <span class="hq-bar__brand">{ui.brand}</span>
        <div class="hq-roles" role="group" aria-label={ui.rolesLabel}>
          {ROLES.map((r) => (
            <button type="button" key={r} class="hq-role" aria-pressed={role === r} onClick={() => choose(r)}>
              {ui.roles[r]}
            </button>
          ))}
        </div>
        <button type="button" class="hq-reset" onClick={reset}>
          <span class="hq-reset__icon" aria-hidden="true"></span>
          {ui.reset}
        </button>
      </div>
      <p class="hq-sr" aria-live="polite">{said}</p>
      <div class="hq-portal hq-enter" key={`${role}:${state.epoch}`}>
        {role === 'admin' && <Supervisor entries={state.entries} onScrollTop={scrollTop} />}
        {role === 'teacher' && <Teacher entries={state.entries} dispatch={dispatch} />}
        {role === 'student' && <StudentView entries={state.entries} />}
      </div>
    </div>
  );
}
