/* Runs on every page. Stamp-in goes first so content can never stay hidden;
   each init is isolated so one failure does not block the others. */
import { initFlood } from './transition';
import { initPop } from './motion/pop';
import { initPress } from './motion/press';

for (const init of [initPop, initFlood, initPress]) {
  try {
    init();
  } catch (err) {
    console.error(err);
  }
}
