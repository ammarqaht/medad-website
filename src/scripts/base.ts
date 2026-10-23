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
