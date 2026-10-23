/* Nabda game engine: pure logic, no DOM. The clock is passed in (ms from
   performance.now) so time is measured, not counted in ticks: a round keeps
   its accuracy however late a frame arrives. Bot answers and flatlines are
   resolved in time order inside each advance. */
import {
  CARDS,
  FREEZE_MS,
  RULES,
  TIME_CARD_MS,
  YOU,
  bots,
  questions,
  youName,
  type CardId,
  type Question,
} from '../../data/nabda';

export type Phase = 'intro' | 'countdown' | 'play' | 'results';

export interface Team {
  id: string;
  name: string;
  you: boolean;
  timeMs: number;
  alive: boolean;
  correct: number;
  /** Round time (ms) until which the team cannot answer. */
  frozenUntil: number;
  /** Bots only: round time of the next answer. */
  nextAt: number;
  /** Points balance across the game. */
  score: number;
  /** Pulse drawing phase (advances only with motion on). */
  beat: number;
}

export interface Award {
  id: string;
  name: string;
  you: boolean;
  alive: boolean;
  timeMs: number;
  points: number;
  doubled: boolean;
  lostDouble: boolean;
}

export interface Served {
  q: string;
  options: string[];
  answer: number;
}

export interface Reveal {
  choice: number;
  answer: number;
  right: boolean;
  until: number;
}

export interface Pending {
  time: number;
  freeze: string[];
  double: boolean;
}

/** What the island should announce (aria-live), produced by the engine. */
export type Event =
  | { kind: 'start' }
  | { kind: 'answer'; right: boolean }
  | { kind: 'low' }
  | { kind: 'thaw'; name: string }
  | { kind: 'end' };

const between = (rnd: () => number, [a, b]: readonly [number, number]) => a + rnd() * (b - a);

function shuffle<T>(list: T[], rnd: () => number): T[] {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class Game {
  phase: Phase = 'intro';
  round = 0;
  paused = false;
  teams: Team[];
  /** Active round time in ms (excludes pauses and the countdown). */
  elapsed = 0;
  countdownLeft = 0;
  current: Served | null = null;
  reveal: Reveal | null = null;
  awards: Award[] = [];
  endedBy = '';
  doubleNow = false;
  pending: Pending = { time: 0, freeze: [], double: false };
  uses: Record<CardId, number> = { time: 0, freeze: 0, double: 0 };
  events: Event[] = [];
  private last = 0;
  private deck: Question[] = [];
  private warned = false;
  private rnd: () => number;

  constructor(rnd: () => number = Math.random) {
    this.rnd = rnd;
    this.teams = [
      this.team(YOU, youName, true),
      ...bots.map((b) => this.team(b.id, b.name, false)),
    ];
  }

  private team(id: string, name: string, you: boolean): Team {
    return { id, name, you, timeMs: RULES.startMs, alive: true, correct: 0, frozenUntil: 0, nextAt: 0, score: 0, beat: 0 };
  }

  get you(): Team {
    return this.teams[0];
  }

  /** Starts the next round, applying the cards bought in the break. */
  start(now: number) {
    this.round++;
    this.phase = 'countdown';
    this.paused = false;
    this.countdownLeft = RULES.countdownMs;
    this.elapsed = 0;
    this.last = now;
    this.reveal = null;
    this.warned = false;
    this.endedBy = '';
    this.awards = [];
    const p = this.pending;
    for (const t of this.teams) {
      t.alive = true;
      t.correct = 0;
      t.timeMs = RULES.startMs + (t.you ? p.time * TIME_CARD_MS : 0);
      t.timeMs = Math.min(t.timeMs, RULES.maxMs);
      t.frozenUntil = p.freeze.includes(t.id) ? FREEZE_MS : 0;
      const spec = bots.find((b) => b.id === t.id);
      if (spec) t.nextAt = t.frozenUntil + between(this.rnd, spec.think);
    }
    this.doubleNow = p.double;
    this.pending = { time: 0, freeze: [], double: false };
    this.serve();
  }

  private serve() {
    if (!this.deck.length) this.deck = shuffle(questions, this.rnd);
    const q = this.deck.pop()!;
    const order = shuffle([0, 1, 2], this.rnd);
    this.current = { q: q.q, options: order.map((i) => q.options[i]), answer: order.indexOf(0) };
  }

  pause(now: number) {
    if (this.phase !== 'countdown' && this.phase !== 'play') return;
    this.tick(now);
    this.paused = true;
  }

  resume(now: number) {
    this.paused = false;
    this.last = now;
  }

  /** Moves the clock to `now`. Safe to call at any rate. */
  tick(now: number) {
    const dt = Math.max(0, now - this.last);
    this.last = now;
    if (this.paused || dt === 0) return;
    let left = dt;
    if (this.phase === 'countdown') {
      if (dt < this.countdownLeft) {
        this.countdownLeft -= dt;
        return;
      }
      left = dt - this.countdownLeft;
      this.countdownLeft = 0;
      this.phase = 'play';
      this.events.push({ kind: 'start' });
    }
    if (this.phase === 'play') this.advance(left);
  }

  /** Beat drawing: one stepped frame. Weaker pulses beat slower. */
  stepBeats() {
    for (const t of this.teams) if (t.alive) t.beat += 3 + 3 * this.strength(t);
  }

  /** 0 (flat) to 1 (full) height of a team's pulse. */
  strength(t: Team): number {
    if (!t.alive || t.timeMs <= 0) return 0;
    return Math.min(1, Math.max(0.12, t.timeMs / RULES.fullMs));
  }

  private advance(dt: number) {
    const target = this.elapsed + dt;
    while (this.phase === 'play' && this.elapsed < target) {
      // the next timed thing: a bot answer, the end of a reveal, or the target
      let at = target;
      let bot: Team | null = null;
      for (const t of this.teams) {
        if (!t.you && t.alive && t.nextAt < at) {
          at = Math.max(this.elapsed, t.nextAt);
          bot = t;
        }
      }
      const revealEnd = this.reveal && this.reveal.until <= at ? this.reveal.until : null;
      if (revealEnd !== null) {
        at = Math.max(this.elapsed, revealEnd);
        bot = null;
      }
      const span = at - this.elapsed;
      // does a pulse stop before then?
      const min = Math.min(...this.teams.filter((t) => t.alive).map((t) => t.timeMs));
      if (min <= span) {
        this.drain(min);
        this.elapsed += min;
        this.flatline();
        return;
      }
      this.drain(span);
      this.elapsed = at;
      if (revealEnd !== null) {
        this.reveal = null;
        this.serve();
      } else if (bot) {
        this.botAnswer(bot);
      }
      this.thawCheck();
    }
    if (this.phase === 'play' && !this.warned && this.you.timeMs < RULES.criticalMs) {
      this.warned = true;
      this.events.push({ kind: 'low' });
    }
  }

  private thawCheck() {
    for (const t of this.teams) {
      if (t.frozenUntil > 0 && this.elapsed >= t.frozenUntil) {
        t.frozenUntil = 0;
        this.events.push({ kind: 'thaw', name: t.name });
      }
    }
  }

  private drain(ms: number) {
    for (const t of this.teams) if (t.alive) t.timeMs -= ms;
  }

  private botAnswer(t: Team) {
    const spec = bots.find((b) => b.id === t.id)!;
    if (this.elapsed < t.frozenUntil) {
      t.nextAt = t.frozenUntil + between(this.rnd, spec.think) * 0.5;
      return;
    }
    const right = this.rnd() < spec.accuracy;
    this.apply(t, right);
    t.nextAt = this.elapsed + between(this.rnd, spec.think);
    if (t.timeMs <= 0) this.flatline();
  }

  private apply(t: Team, right: boolean) {
    if (right) {
      t.correct++;
      t.timeMs = Math.min(RULES.maxMs, t.timeMs + RULES.correctMs);
    } else {
      t.timeMs = Math.max(0, t.timeMs - RULES.wrongMs);
    }
  }

  frozen(t: Team): boolean {
    return this.phase === 'play' && t.frozenUntil > 0 && this.elapsed < t.frozenUntil;
  }

  /** The visitor answers option `i`. */
  answer(i: number, now: number) {
    this.tick(now);
    if (this.phase !== 'play' || this.paused || this.reveal || !this.current) return;
    const right = i === this.current.answer;
    this.apply(this.you, right);
    if (this.you.timeMs > RULES.criticalMs) this.warned = false;
    this.reveal = { choice: i, answer: this.current.answer, right, until: this.elapsed + RULES.revealMs };
    if (this.you.timeMs <= 0) {
      this.flatline();
      return;
    }
    this.events.push({ kind: 'answer', right });
  }

  private flatline() {
    const stopped = this.teams.filter((t) => t.alive && t.timeMs <= 0.5);
    for (const t of stopped) {
      t.timeMs = 0;
      t.alive = false;
    }
    this.endedBy = stopped.some((t) => t.you) ? YOU : (stopped[0]?.name ?? '');
    this.end();
  }

  private end() {
    this.phase = 'results';
    this.paused = false;
    this.reveal = null;
    const survivors = this.teams.filter((t) => t.alive).sort((a, b) => b.timeMs - a.timeMs);
    const awards: Award[] = [];
    survivors.forEach((t, i) => awards.push(this.credit(t, RULES.rankPoints[i] ?? 1)));
    for (const t of this.teams.filter((x) => !x.alive)) awards.push(this.credit(t, 0));
    this.awards = awards.sort((a, b) => b.points - a.points || b.timeMs - a.timeMs);
    this.doubleNow = false;
    this.events.push({ kind: 'end' });
  }

  private credit(t: Team, rank: number): Award {
    const base = rank + t.correct;
    const doubled = t.you && this.doubleNow && t.alive;
    const points = doubled ? base * 2 : base;
    t.score += points;
    return {
      id: t.id,
      name: t.name,
      you: t.you,
      alive: t.alive,
      timeMs: Math.max(0, t.timeMs),
      points,
      doubled,
      lostDouble: t.you && this.doubleNow && !t.alive,
    };
  }

  /** Why a card cannot be bought now, or '' when it can. */
  blocked(card: CardId, target?: string): 'noUses' | 'noPoints' | 'already' | 'pickTeam' | '' {
    const c = CARDS[card];
    if (this.uses[card] >= c.limit) return 'noUses';
    if (card === 'double' && this.pending.double) return 'already';
    if (card === 'freeze') {
      if (!target) return 'pickTeam';
      if (this.pending.freeze.includes(target)) return 'already';
    }
    if (this.you.score < c.price) return 'noPoints';
    return '';
  }

  buy(card: CardId, target?: string): boolean {
    if (this.phase !== 'results' || this.blocked(card, target)) return false;
    this.you.score -= CARDS[card].price;
    this.uses[card]++;
    if (card === 'time') this.pending.time++;
    if (card === 'double') this.pending.double = true;
    if (card === 'freeze' && target) this.pending.freeze.push(target);
    return true;
  }

  drainEvents(): Event[] {
    const e = this.events;
    this.events = [];
    return e;
  }
}
