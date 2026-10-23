/* Runs on every page. Each init is isolated so one failure does not block the others. */
import { initBack, initFlood } from './transition';
import { initPop } from './motion/pop';
import { initPress } from './motion/press';
import { initInkWrite } from './motion/inkwrite';

let ok = true;
for (const init of [initPop, initInkWrite, initFlood, initBack, initPress]) {
  try {
    init();
  } catch (err) {
    ok = false;
    console.error(err);
  }
}
// Every reveal is wired: cancel boot.js's fail-open timer. If anything failed,
// the timer lifts .js and all hidden content shows in its final state.
if (ok) window.clearTimeout(window.__medadBoot?.js);

// Safety net: whatever an observer missed is revealed in its final state.
window.setTimeout(() => {
  document.querySelectorAll('[data-pop]:not(.is-in)').forEach((el) => el.classList.add('is-in'));
  document.querySelectorAll('[data-ink]:not(.is-writing, .is-written)').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-written');
  });
}, 8000);
