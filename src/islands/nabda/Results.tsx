/* Round results and the card shop (FR-20). Points are spent now; the card
   works in the next round. Each card has a game-wide limit. */
import type { RefObject } from 'preact';
import { useState } from 'preact/hooks';
import { CARDS, CARD_IDS, ui, type CardId } from '../../data/nabda';
import type { Game } from './engine';
import { Num, ar, pointsText, secondsText, secs } from './parts';

interface Props {
  game: Game;
  head: RefObject<HTMLHeadingElement | null>;
  onAgain: () => void;
  onChange: () => void;
  onSay: (s: string) => void;
}

export function Results({ game: g, head, onAgain, onChange, onSay }: Props) {
  const [target, setTarget] = useState<string>('');
  const s = ui.results;
  const shop = ui.shop;
  const bots = g.teams.filter((t) => !t.you);

  const buy = (card: CardId) => {
    if (g.buy(card, card === 'freeze' ? target : undefined)) {
      const name = card === 'freeze' ? `${CARDS[card].name} ${g.teams.find((t) => t.id === target)?.name ?? ''}` : CARDS[card].name;
      onSay(`${shop.bought(name)} ${s.balance} ${pointsText(g.you.score)}.`);
      if (card === 'freeze') setTarget('');
      onChange();
    }
  };

  const pendingList: string[] = [];
  if (g.pending.time) pendingList.push(g.pending.time > 1 ? `${CARDS.time.name} ${ar(g.pending.time)}` : CARDS.time.name);
  for (const id of g.pending.freeze) pendingList.push(`${CARDS.freeze.name} ${g.teams.find((t) => t.id === id)?.name}`);
  if (g.pending.double) pendingList.push(CARDS.double.name);

  return (
    <div class="nb-res">
      <section class="nb-card" aria-labelledby="nb-res-h">
        <h2 class="nb-h" id="nb-res-h" tabIndex={-1} ref={head}>{s.title(ar(g.round))}</h2>
        <p class="nb-res__by">{g.endedBy === 'you' ? s.endedByYou : s.endedBy(g.endedBy)}</p>
        <ol class="nb-rank">
          {g.awards.map((a) => (
            <li key={a.id} class={`nb-rank__row${a.you ? ' is-you' : ''}${a.alive ? '' : ' is-dead'}`}>
              <span class="nb-rank__name">{a.name}</span>
              <span class="nb-rank__time">
                {a.alive ? `${s.left} ${secondsText(secs(a.timeMs))}` : ui.stopped}
              </span>
              <span class="nb-rank__pts">
                {pointsText(a.points)}
                {a.doubled && <span class="nb-rank__note">{s.doubled}</span>}
                {a.lostDouble && <span class="nb-rank__note">{s.lostDouble}</span>}
              </span>
            </li>
          ))}
        </ol>
        <p class="nb-balance">
          <span>{s.balance}</span>
          <span class="nb-balance__num"><Num n={g.you.score} /></span>
        </p>
      </section>

      <section class="nb-card nb-shop" aria-labelledby="nb-shop-h">
        <h2 class="nb-h nb-h--sm" id="nb-shop-h">{shop.title}</h2>
        <p class="nb-shop__line">{shop.line}</p>
        <ul class="nb-cards">
          {CARD_IDS.map((id) => {
            const c = CARDS[id];
            const why = g.blocked(id, id === 'freeze' ? target : undefined);
            const left = c.limit - g.uses[id];
            const reasonId = `nb-why-${id}`;
            return (
              <li key={id} class={`nb-cardx nb-cardx--${id}`}>
                <div class="nb-cardx__head">
                  <span class="nb-cardx__name">{c.name}</span>
                  <span class="nb-cardx__meta">
                    <span>{shop.price} <Num n={c.price} /></span>
                    <span>{shop.uses} <Num n={left} /></span>
                  </span>
                </div>
                <p class="nb-cardx__effect">{c.effect}</p>
                {id === 'freeze' && left > 0 && (
                  <div class="nb-targets" role="group" aria-label={shop.targetLabel}>
                    {bots.map((b) => (
                      <button
                        type="button"
                        key={b.id}
                        class="nb-chip"
                        aria-pressed={target === b.id}
                        onClick={() => setTarget(target === b.id ? '' : b.id)}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                )}
                <div class="nb-cardx__buy">
                  <button
                    type="button"
                    class="nb-btn nb-btn--sm"
                    aria-disabled={why ? 'true' : undefined}
                    aria-describedby={why ? reasonId : undefined}
                    onClick={() => !why && buy(id)}
                  >
                    {shop.buy}
                  </button>
                  {why && <span class="nb-cardx__why" id={reasonId}>{shop[why]}</span>}
                </div>
              </li>
            );
          })}
        </ul>
        <p class="nb-pending">
          <span class="nb-pending__label">{shop.pending}</span>
          {pendingList.length ? pendingList.join('، ') : shop.none}
        </p>
      </section>

      <button type="button" class="nb-btn nb-btn--go" onClick={onAgain}>{ui.again}</button>
    </div>
  );
}
