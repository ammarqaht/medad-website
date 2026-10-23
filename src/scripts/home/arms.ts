/* The two worlds: the fork draws when the section arrives, the digital
   screens open one at a time (cycling until the visitor picks one), and the
   live card holds a one-question quiz. */
import { reducedMotion } from '../motion/reduced';

const CYCLE_MS = 2400;

export function initArms(): void {
  const arms = document.querySelector<HTMLElement>('[data-arms]');
  if (!arms) return;

  new IntersectionObserver(
    (entries, io) => {
      if (entries[0].isIntersecting) {
        arms.classList.add('is-forked');
        io.disconnect();
      }
    },
    { threshold: 0 },
  ).observe(arms);

  // Screens: one open at a time.
  const screens = Array.from(arms.querySelectorAll<HTMLButtonElement>('[data-screens] .screen'));
  const open = (i: number) => screens.forEach((s, j) => s.setAttribute('aria-pressed', String(i === j)));
  let current = Math.max(0, screens.findIndex((s) => s.getAttribute('aria-pressed') === 'true'));
  let cycle = 0;
  const stop = () => window.clearInterval(cycle);
  screens.forEach((s, i) => {
    s.addEventListener('click', () => {
      stop();
      current = i;
      open(i);
    });
    s.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      stop();
      current = i;
      open(i);
    });
  });
  if (screens.length && !reducedMotion()) {
    let visible = false;
    new IntersectionObserver((e) => (visible = e[e.length - 1].isIntersecting)).observe(screens[0].parentElement!);
    cycle = window.setInterval(() => {
      if (!visible) return;
      current = (current + 1) % screens.length;
      open(current);
    }, CYCLE_MS);
  }

  // Quiz: right answer stamps green and stays; a wrong one shakes and resets.
  const quiz = arms.querySelector<HTMLElement>('[data-quiz]');
  if (!quiz) return;
  const answer = Number(quiz.dataset.answer);
  const say = quiz.querySelector<HTMLElement>('.quiz__say');
  quiz.querySelectorAll<HTMLButtonElement>('.quiz__opt').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (quiz.classList.contains('is-solved')) return;
      const right = Number(btn.dataset.i) === answer;
      if (say) say.textContent = (right ? quiz.dataset.right : quiz.dataset.wrong) || '';
      if (right) {
        quiz.classList.add('is-solved');
        btn.classList.add('is-right');
        btn.setAttribute('aria-pressed', 'true');
        return;
      }
      btn.classList.remove('is-wrong');
      void btn.offsetWidth; // restart the shake
      btn.classList.add('is-wrong');
      window.setTimeout(() => btn.classList.remove('is-wrong'), 900);
    });
  });
}
