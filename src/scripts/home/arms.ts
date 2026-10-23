/* The two worlds: the fork draws when the section arrives, the digital
   screens open one at a time (cycling until the visitor picks one), and the
   live card holds a one-question quiz. */
import { reducedMotion } from '../motion/reduced';

const CYCLE_MS = 2400;

export function initArms(): void {
  const arms = document.querySelector<HTMLElement>('[data-arms]');
  if (!arms) return;

  // The fork: from the bottom of the title to the top centre of each card.
  const fork = arms.querySelector<SVGSVGElement>('.arms__fork');
  const title = arms.querySelector<HTMLElement>('.arms__title');
  const cards = Array.from(arms.querySelectorAll<HTMLElement>('.arm'));
  const drawFork = () => {
    if (!fork || !title || cards.length < 2) return;
    const box = arms.getBoundingClientRect();
    const t = title.getBoundingClientRect();
    const sx = t.left + t.width / 2 - box.left;
    const sy = t.bottom - box.top + 12;
    fork.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    fork.querySelectorAll('path').forEach((path, i) => {
      const c = cards[i].getBoundingClientRect();
      const ex = c.left + c.width / 2 - box.left;
      const ey = c.top - box.top + 4;
      const split = sy + (ey - sy) * 0.35;
      path.setAttribute('d', `M${sx},${sy} V${split} C${sx},${(split + ey) / 2} ${ex},${(split + ey) / 2} ${ex},${ey}`);
      path.style.setProperty('--len', String(Math.ceil(path.getTotalLength())));
    });
  };
  drawFork();
  document.fonts?.ready.then(drawFork);
  new ResizeObserver(drawFork).observe(arms);

  new IntersectionObserver(
    (entries, io) => {
      if (entries[entries.length - 1].isIntersecting) {
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
  // Any touch or keyboard focus hands control to the visitor (WCAG 2.2.2).
  const group = screens[0]?.parentElement;
  ['focusin', 'pointerdown'].forEach((ev) => group?.addEventListener(ev, stop, { once: true }));
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
      // Clear then set, so a repeated message is announced again.
      const msg = (right ? quiz.dataset.right : quiz.dataset.wrong) || '';
      if (say) {
        say.textContent = '';
        requestAnimationFrame(() => (say.textContent = msg));
      }
      if (right) {
        quiz.classList.add('is-solved');
        btn.classList.add('is-right');
        btn.setAttribute('aria-pressed', 'true');
        quiz.querySelectorAll<HTMLButtonElement>('.quiz__opt').forEach((o) => {
          if (o !== btn) o.disabled = true;
        });
        return;
      }
      btn.classList.remove('is-wrong');
      void btn.offsetWidth; // restart the shake
      btn.classList.add('is-wrong');
      window.setTimeout(() => btn.classList.remove('is-wrong'), 900);
    });
  });
}
