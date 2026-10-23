import { expect, test } from '@playwright/test';
import { Game } from '../src/islands/nabda/engine';
import { RULES } from '../src/data/nabda';

/* The pure Nabda engine, driven with a fixed random source and a hand-held
   clock (ms). rnd = 0.99 means every bot answer is wrong and bots think for
   their longest time, so the visitor's own moves decide the round. */

const CD = RULES.countdownMs;
const fresh = () => new Game(() => 0.99);
const team = (g: Game, id: string) => g.teams.find((t) => t.id === id)!;
/** Ends the current round by letting the clocks run out. */
const finish = (g: Game, at: number) => {
  g.tick(at + 200_000);
  expect(g.phase).toBe('results');
};
const answerRight = (g: Game, at: number) => g.answer(g.current!.answer, at);
const answerWrong = (g: Game, at: number) => g.answer((g.current!.answer + 1) % 3, at);

test.describe('Nabda engine', () => {
  test('should count the clock only while running, not during the countdown or a pause', () => {
    const g = fresh();
    g.start(0);
    g.tick(1000);
    expect(g.phase).toBe('countdown');
    expect(g.you.timeMs).toBe(RULES.startMs);
    g.tick(CD + 2000);
    expect(g.phase).toBe('play');
    expect(g.you.timeMs).toBe(RULES.startMs - 2000);
    g.pause(CD + 2000);
    g.tick(CD + 12_000);
    expect(g.you.timeMs).toBe(RULES.startMs - 2000);
    g.resume(CD + 12_000);
    g.tick(CD + 13_000);
    expect(g.you.timeMs).toBe(RULES.startMs - 3000);
  });

  test('should not stay paused when the pause itself ends the round, and start the next round with no stale events', () => {
    const g = fresh();
    g.start(0);
    g.pause(CD + 60_000);
    expect(g.phase).toBe('results');
    expect(g.paused).toBe(false);
    expect(g.events.some((e) => e.kind === 'end')).toBe(true);
    g.start(CD + 61_000);
    expect(g.events).toEqual([]);
    expect(g.paused).toBe(false);
  });

  test('should add and take time for answers and award rank points plus right answers', () => {
    const g = fresh();
    g.start(0);
    answerRight(g, CD + 1000);
    expect(g.you.timeMs).toBe(RULES.startMs - 1000 + RULES.correctMs);
    expect(g.reveal?.right).toBe(true);
    g.answer(0, CD + 1100); // ignored while the answer is shown
    expect(g.you.correct).toBe(1);
    g.tick(CD + 2000);
    expect(g.reveal).toBeNull();
    answerWrong(g, CD + 2000);
    expect(g.you.timeMs).toBe(RULES.startMs - 2000 + RULES.correctMs - RULES.wrongMs);
    g.tick(CD + 3000);
    answerRight(g, CD + 3000);
    finish(g, CD + 3000);

    const you = g.awards.find((a) => a.you)!;
    expect(you.alive).toBe(true);
    // bots always miss here, so the visitor has the most time: first place, 2 points
    expect(you.points).toBe(RULES.rankPoints[0] + 2);
    expect(g.you.score).toBe(you.points);
    for (const a of g.awards.filter((x) => !x.alive)) expect(a.points).toBe(0);
    expect(g.awards.filter((x) => !x.alive).length).toBeGreaterThan(0);
  });

  test('should end the round for everyone when two pulses stop at the same moment', () => {
    const g = fresh();
    g.start(0);
    g.tick(CD);
    g.you.timeMs = 1000;
    team(g, 'saqr').timeMs = 1000;
    team(g, 'mawj').timeMs = 20_000;
    for (const t of g.teams) t.nextAt = 99_999;
    g.tick(CD + 1000);
    expect(g.phase).toBe('results');
    expect(g.awards.filter((a) => !a.alive).map((a) => a.id).sort()).toEqual(['saqr', 'you']);
    expect(g.endedBy).toBe('you');
    expect(g.awards.find((a) => a.id === 'mawj')!.points).toBe(RULES.rankPoints[0]);
  });

  test('should keep prices and limits, and say why a card is refused', () => {
    const g = fresh();
    g.start(0);
    finish(g, 0);
    g.you.score = 0;
    expect(g.blocked('time')).toBe('noPoints');
    expect(g.buy('time')).toBe(false);

    g.you.score = 100;
    for (let i = 0; i < 4; i++) expect(g.buy('time')).toBe(true);
    expect(g.you.score).toBe(100 - 4 * 3);
    expect(g.blocked('time')).toBe('noUses');
    expect(g.buy('time')).toBe(false);

    expect(g.blocked('freeze')).toBe('pickTeam');
    expect(g.buy('freeze', 'saqr')).toBe(true);
    expect(g.blocked('freeze', 'saqr')).toBe('already');
    expect(g.you.score).toBe(88 - 4);

    expect(g.buy('double')).toBe(true);
    expect(g.blocked('double')).toBe('already');
    expect(g.you.score).toBe(84 - 6);

    // four extra-time cards fit under the cap
    g.start(1_000_000);
    expect(g.you.timeMs).toBe(RULES.startMs + 4 * 10_000);
    finish(g, 1_000_000);
    g.you.score = 100;
    expect(g.buy('double')).toBe(true);
    g.start(2_000_000);
    finish(g, 2_000_000);
    g.you.score = 100;
    expect(g.blocked('double')).toBe('noUses');
  });

  test('should lock a frozen team for five seconds while its clock still drains', () => {
    const g = fresh();
    g.start(0);
    finish(g, 0);
    g.you.score = 10;
    g.buy('freeze', 'saqr');
    g.start(1000);
    const saqr = team(g, 'saqr');
    g.tick(1000 + CD + 4000);
    expect(g.frozen(saqr)).toBe(true);
    // unfrozen, this bot would have missed once by now (its first answer is under five seconds)
    g.tick(1000 + CD + 5000);
    expect(saqr.timeMs).toBe(RULES.startMs - 5000);
    expect(g.frozen(saqr)).toBe(false);
    expect(g.drainEvents().some((e) => e.kind === 'thaw' && e.name === saqr.name)).toBe(true);
  });

  test('should double the next round when you survive and drop the double when your pulse stops', () => {
    const g = fresh();
    g.start(0);
    finish(g, 0);
    g.you.score = 6;
    g.buy('double');
    g.start(1000);
    finish(g, 1000);
    let you = g.awards.find((a) => a.you)!;
    expect(you.alive).toBe(true);
    expect(you.doubled).toBe(true);
    expect(you.points).toBe(RULES.rankPoints[0] * 2);

    g.you.score = 6;
    g.buy('double');
    g.start(500_000);
    let t = 500_000 + CD;
    g.tick(t);
    answerRight(g, t);
    while (g.phase === 'play') {
      t += RULES.revealMs;
      g.tick(t);
      if (g.phase === 'play' && !g.reveal) answerWrong(g, t);
    }
    you = g.awards.find((a) => a.you)!;
    expect(you.alive).toBe(false);
    expect(you.doubled).toBe(false);
    expect(you.lostDouble).toBe(true);
    expect(you.points).toBe(1); // the right answer only, not doubled
  });
});
