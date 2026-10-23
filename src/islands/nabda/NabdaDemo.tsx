/* Nabda demo island (FR-19, FR-20). The visitor plays one team against two
   bot teams: each pulse is a countdown, the first one that stops ends the
   round, then a card shop feeds the next round. Mobile first: the whole round
   fits the phone screen without scrolling. No network, no storage, no inline
   styles (the CSP is hashed). Loaded only on /works/nabda. */
import { useEffect, useRef, useState } from 'preact/hooks';
import { RULES, ui } from '../../data/nabda';
import { Game, type Event } from './engine';
import { Num, Pulse, ar, secondsText, secs } from './parts';
import { Results } from './Results';
import './nabda.css';

const now = () => performance.now();

export default function NabdaDemo() {
  const game = useRef<Game | null>(null);
  if (!game.current) game.current = new Game();
  const g = game.current;
  const [, setFrame] = useState(0);
  const [said, setSaid] = useState('');
  const [still, setStill] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const qHead = useRef<HTMLHeadingElement>(null);
  const resHead = useRef<HTMLHeadingElement>(null);
  const lastPhase = useRef(g.phase);
  const stillRef = useRef(false);

  const redraw = () => setFrame((f) => f + 1);

  const scrollTop = () => {
    const screen = root.current?.closest('[data-screen]');
    if (screen) screen.scrollTop = 0;
  };

  const announce = (events: Event[]) => {
    const g = game.current!;
    const parts: string[] = [];
    for (const e of events) {
      if (e.kind === 'start') {
        parts.push(ui.startSaid);
        for (const t of g.teams) if (t.frozenUntil > 0) parts.push(ui.froze(t.name));
        if (g.current) parts.push(g.current.q);
      } else if (e.kind === 'answer') {
        parts.push(
          e.right
            ? `${ui.right}، ${secondsText(RULES.correctMs / 1000)} لنبضك.`
            : `${ui.wrong}، خصم ${secondsText(RULES.wrongMs / 1000)}.`,
        );
      } else if (e.kind === 'low') parts.push(ui.low);
      else if (e.kind === 'thaw') parts.push(ui.thawed(e.name));
      else if (e.kind === 'end') {
        parts.push(ui.results.title(ar(g.round)));
        parts.push(g.endedBy === 'you' ? ui.results.endedByYou : ui.results.endedBy(g.endedBy));
      }
    }
    if (parts.length) setSaid(parts.join(' '));
  };

  // after an answer, read the next question once it is served
  const pendingRead = useRef('');

  /** Pauses a running round. Anything the last tick produced (even the end of
      the round) is announced now, never carried into the next round. */
  const pauseNow = (text: string) => {
    const g = game.current!;
    if ((g.phase !== 'countdown' && g.phase !== 'play') || g.paused) return;
    g.pause(now());
    const ev = g.drainEvents();
    if (ev.length) announce(ev);
    if (g.paused) setSaid(text);
    redraw();
  };

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const setMq = () => {
      stillRef.current = mq.matches;
      setStill(mq.matches);
    };
    setMq();
    mq.addEventListener('change', setMq);

    const onHide = () => {
      if (document.hidden) pauseNow(ui.autoPaused);
    };
    document.addEventListener('visibilitychange', onHide);

    // a round does not run while the demo is scrolled out of sight
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) pauseNow(ui.scrollPaused);
    });
    if (root.current) io.observe(root.current);

    return () => {
      mq.removeEventListener('change', setMq);
      document.removeEventListener('visibilitychange', onHide);
      io.disconnect();
    };
  }, []);

  // the 12 fps clock runs only while a round is running
  const running = (g.phase === 'countdown' || g.phase === 'play') && !g.paused;
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const g = game.current!;
      if ((g.phase !== 'countdown' && g.phase !== 'play') || g.paused) return;
      g.tick(now());
      if (!stillRef.current) g.stepBeats();
      const ev = g.drainEvents();
      if (ev.length) announce(ev);
      if (pendingRead.current && g.current && !g.reveal && g.current.q !== pendingRead.current) {
        setSaid(`${ui.next}: ${g.current.q}`);
        pendingRead.current = '';
      }
      redraw();
    }, RULES.frameMs);
    return () => window.clearInterval(id);
  }, [running]);

  /** Move focus only when the visitor is not using another control. */
  const mayFocus = () => {
    const a = document.activeElement;
    return !a || a === document.body || !!root.current?.contains(a);
  };

  // focus follows the phase so keyboard users land on what changed
  useEffect(() => {
    if (lastPhase.current === g.phase) return;
    lastPhase.current = g.phase;
    if (g.phase === 'play' && mayFocus()) qHead.current?.focus();
    if (g.phase === 'results') {
      scrollTop();
      if (mayFocus()) resHead.current?.focus();
    }
  });

  const start = () => {
    g.start(now());
    setSaid(`${ui.round(ar(g.round))}. ${ui.ready}.`);
    scrollTop();
    redraw();
    // the countdown is a live region; focus its card so Tab reaches the answers next
    requestAnimationFrame(() => qHead.current?.focus());
  };

  const togglePause = () => {
    if (g.paused) {
      g.resume(now());
      setSaid(ui.resumedSaid);
      redraw();
    } else {
      pauseNow(ui.pausedSaid);
    }
  };

  const reset = () => {
    game.current = new Game();
    lastPhase.current = 'intro';
    pendingRead.current = '';
    setSaid(ui.resetDone);
    scrollTop();
    redraw();
  };

  const answer = (i: number) => {
    const q = g.current?.q ?? '';
    g.answer(i, now());
    const ev = g.drainEvents();
    announce(ev);
    if (g.phase === 'play') pendingRead.current = q;
    redraw();
  };

  const live = g.phase === 'countdown' || g.phase === 'play';

  return (
    <div class={`nb nb--${g.phase}${g.paused ? ' is-paused' : ''}`} ref={root}>
      <div class="nb-bar">
        <span class="nb-bar__brand">{ui.brand}</span>
        {g.round > 0 && <span class="nb-bar__round">{ui.round(ar(g.round))}</span>}
        <div class="nb-bar__tools">
          {live && (
            <button type="button" class="nb-tool" onClick={togglePause}>
              <span class={`nb-tool__icon ${g.paused ? 'is-play' : 'is-pause'}`} aria-hidden="true"></span>
              {g.paused ? ui.resume : ui.pause}
            </button>
          )}
          <button type="button" class="nb-tool" onClick={reset}>
            <span class="nb-tool__icon is-reset" aria-hidden="true"></span>
            {ui.reset}
          </button>
        </div>
      </div>
      <p class="nb-sr" aria-live="polite">{said}</p>

      {g.phase === 'results' ? (
        <Results game={g} head={resHead} onAgain={start} onChange={redraw} onSay={setSaid} />
      ) : (
        <div class="nb-play">
          <ul class="nb-teams" aria-label={ui.teamsLabel}>
            {g.teams.map((t) => {
              const s = secs(t.timeMs);
              const state = !t.alive ? 'is-dead' : t.timeMs < RULES.criticalMs ? 'is-critical' : t.timeMs < RULES.weakMs ? 'is-weak' : 'is-ok';
              const frozen = g.frozen(t) || (g.phase === 'countdown' && t.frozenUntil > 0);
              return (
                <li key={t.id} class={`nb-team ${state}${t.you ? ' is-you' : ''}${frozen ? ' is-frozen' : ''}`}>
                  <span class="nb-team__name">{t.name}</span>
                  <Pulse team={t} strength={g.strength(t)} still={still} />
                  <span class="nb-team__secs">
                    {frozen ? <span class="nb-team__flag">{ui.frozen}</span> : null}
                    <span aria-hidden="true"><Num n={s} /></span>
                    <span class="nb-sr">{secondsText(s)}</span>
                  </span>
                </li>
              );
            })}
          </ul>

          {g.phase === 'intro' ? (
            <section class="nb-card nb-intro" aria-labelledby="nb-intro-h">
              <h2 class="nb-h" id="nb-intro-h">{ui.intro.title}</h2>
              <ul class="nb-rules">
                {ui.intro.rules.map((r) => <li key={r}>{r}</li>)}
              </ul>
              <button type="button" class="nb-btn nb-btn--go" onClick={start}>{ui.intro.start}</button>
            </section>
          ) : (
            <section class="nb-card nb-q" aria-labelledby="nb-q-h">
              {g.phase === 'countdown' ? (
                <>
                  <h2 class="nb-h nb-q__text" id="nb-q-h" tabIndex={-1} ref={qHead}>{ui.ready}</h2>
                  <p class="nb-count" aria-hidden="true">
                    <Num n={Math.max(1, Math.ceil(g.countdownLeft / 1000))} />
                  </p>
                </>
              ) : (
                <>
                  <h2 class="nb-h nb-q__text" id="nb-q-h" tabIndex={-1} ref={qHead}>{g.current?.q}</h2>
                  <div class="nb-opts" role="group" aria-label={ui.optionsLabel}>
                    {g.current?.options.map((o, i) => {
                      const r = g.reveal;
                      const mark = r ? (i === r.answer ? ' is-right' : i === r.choice ? ' is-wrong' : ' is-dim') : '';
                      const off = g.paused || !!r;
                      return (
                        <button
                          type="button"
                          key={i}
                          class={`nb-opt${mark}`}
                          aria-disabled={off ? 'true' : undefined}
                          onClick={() => !off && answer(i)}
                        >
                          {o}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
              {g.paused && <p class="nb-paused">{ui.paused}</p>}
              <p class={`nb-said${g.reveal ? (g.reveal.right ? ' is-right' : ' is-wrong') : ''}`} aria-hidden="true">
                {g.reveal
                  ? g.reveal.right
                    ? `${ui.right}، ${secondsText(RULES.correctMs / 1000)} لنبضك`
                    : `${ui.wrong}، خصم ${secondsText(RULES.wrongMs / 1000)}`
                  : ''}
              </p>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
