import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  apply,
  bestScore,
  cardId,
  createGame,
  legalActions,
  nextInt,
  parseCards,
  redactEvents,
  resolveRound,
  startRound,
  viewFor,
  type GameEvent,
  type GameState,
} from '../src/index';
import { scriptDeck } from './helpers';

const seats = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`);

function must(result: ReturnType<typeof apply>): GameState {
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.state;
}

describe('bestScore', () => {
  it('equals scoreHand on three cards and takes the best three of four', () => {
    expect(bestScore(parseCards('Kh Qh 2c'))?.total).toBe(20);
    expect(bestScore(parseCards('Kh Qh 2c 9h'))).toMatchObject({ total: 29, suit: 'hearts' });
    expect(bestScore(parseCards('3h 3c 3d 3s'))).toMatchObject({ total: 30, kind: 'trips' });
    expect(bestScore(parseCards('Kh'))).toBeNull();
  });
});

describe('viewFor', () => {
  const deck = scriptDeck(['Kh Qh 2c', '9d 3c 4s', '5s 6s 7c'], '2d', ['Ah']);
  const g = startRound(createGame(seats(3), 1, { dealer: 2 }), { deck }).state; // turn 0

  it('shows your own hand and score, and only counts for everyone else', () => {
    const v = viewFor(g, 1);
    expect(v.seat).toBe(1);
    expect(v.hand.map(cardId)).toEqual(['9d', '3c', '4s']);
    expect(v.handScore).toMatchObject({ total: 9, suit: 'diamonds' });
    expect(v.seats.map((s) => s.cardCount)).toEqual([3, 3, 3]);
    expect(v.seats.every((s) => s.revealed === null)).toBe(true);
    expect(v.discardTop).toEqual({ rank: '2', suit: 'diamonds' });
    expect(v.drawPileCount).toBe(52 - 9 - 1);
    expect(v.seats[0]).toMatchObject({
      isTurn: true,
      isDealer: false,
      isKnocker: false,
      onBus: false,
    });
    expect(v.seats[2]!.isDealer).toBe(true);
    expect(v.legalActions).toEqual([]);
    expect(viewFor(g, 0).legalActions).toEqual(['draw', 'knock']);
  });

  it('a four-card hand shows the best-three value and the untouchable discard', () => {
    const top = g.discardPile[0]!;
    const s = must(apply(g, 0, { type: 'draw', source: 'discard' }));
    const mine = viewFor(s, 0);
    expect(mine.hand).toHaveLength(4);
    expect(mine.handScore?.total).toBe(20);
    expect(mine.tookFromDiscard).toEqual(top);
    expect(mine.legalActions).toEqual(['discard']);
    const theirs = viewFor(s, 1);
    expect(theirs.seats[0]!.cardCount).toBe(4);
    expect(theirs.tookFromDiscard).toBeNull();
    expect(theirs.discardTop).toBeNull();
  });

  it('reveals every hand once the round is over, and shows the result', () => {
    let s = must(apply(g, 0, { type: 'knock' }));
    for (const seat of [1, 2]) {
      s = must(apply(s, seat, { type: 'draw', source: 'deck' }));
      s = must(apply(s, seat, { type: 'discard', card: s.seats[seat]!.hand[3]! }));
    }
    expect(s.phase).toBe('roundOver');
    const v = viewFor(s, 2);
    expect(v.roundResult?.reason).toBe('knock');
    expect(v.seats.map((x) => x.revealed?.score.total)).toEqual([20, 9, 11]);
    expect(v.seats[0]!.isKnocker).toBe(true);
    expect(v.seats.some((x) => x.isTurn)).toBe(false);
    const after = resolveRound(s).state;
    expect(viewFor(after, 0).seats[1]).toMatchObject({ folds: 1, revealed: null });
    expect(viewFor(after, 0).roundResult).toBeNull();
  });

  it('rejects a seat that does not exist', () => {
    expect(() => viewFor(g, 3)).toThrow();
  });
});

describe('redactEvents', () => {
  it('hides the card of a deck draw from everyone but the drawer', () => {
    const g = startRound(createGame(seats(3), 1, { dealer: 2 })).state;
    const r = apply(g, 0, { type: 'draw', source: 'deck' });
    if (!r.ok) throw new Error('draw failed');
    const drew = r.events.find((e) => e.type === 'drew')!;
    expect('card' in drew && drew.card).toBeTruthy();
    const forMe = redactEvents(r.events, 0).find((e) => e.type === 'drew')!;
    const forThem = redactEvents(r.events, 1).find((e) => e.type === 'drew')!;
    expect(forMe).toEqual(drew);
    expect(forThem).toEqual({ type: 'drew', seat: 0, source: 'deck' });
  });

  it('leaves discard-pile draws, discards, and the reveal public', () => {
    const g = startRound(createGame(seats(3), 1, { dealer: 2 })).state;
    const r = apply(g, 0, { type: 'draw', source: 'discard' });
    if (!r.ok) throw new Error('draw failed');
    expect(redactEvents(r.events, 2)).toEqual(r.events);
  });
});

describe('hidden hands — properties', () => {
  /** Every card a viewer could possibly see from a view and its redacted events. */
  function visibleCards(
    state: GameState,
    viewer: number,
    events: readonly GameEvent[],
  ): Set<string> {
    const v = viewFor(state, viewer);
    const seen = new Set<string>(v.hand.map(cardId));
    if (v.discardTop) seen.add(cardId(v.discardTop));
    for (const s of v.seats) if (s.revealed) for (const c of s.revealed.hand) seen.add(cardId(c));
    for (const h of v.roundResult?.hands ?? []) for (const c of h.hand) seen.add(cardId(c));
    for (const e of redactEvents(events, viewer)) {
      if (e.type === 'drew' && e.card) seen.add(cardId(e.card));
      if (e.type === 'discarded') seen.add(cardId(e.card));
      if (e.type === 'thirtyOne') for (const c of e.hand) seen.add(cardId(c));
      if (e.type === 'roundStarted') seen.add(cardId(e.discardTop));
      if (e.type === 'roundOver')
        for (const h of e.hands) for (const c of h.hand) seen.add(cardId(c));
    }
    return seen;
  }

  it('no view or redacted event ever shows another seat a card from your hand before the reveal', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer({ min: 2, max: 10 }), (seed, n) => {
        let g = startRound(createGame(seats(n), seed)).state;
        let rng = g.rng;
        let steps = 0;
        while (g.phase === 'playing' && steps++ < 400) {
          const seat = g.turn;
          const legal = legalActions(g, seat);
          const step = nextInt(rng, 100);
          rng = step.state;
          let r;
          if (legal.includes('discard')) {
            const hand = g.seats[seat]!.hand;
            r = apply(g, seat, { type: 'discard', card: hand[step.value % hand.length]! });
            if (!r.ok)
              r = apply(g, seat, { type: 'discard', card: hand[(step.value + 1) % hand.length]! });
          } else if (legal.includes('knock') && step.value < 5) {
            r = apply(g, seat, { type: 'knock' });
          } else {
            r = apply(g, seat, { type: 'draw', source: step.value % 3 === 0 ? 'discard' : 'deck' });
            if (!r.ok) r = apply(g, seat, { type: 'draw', source: 'deck' });
          }
          if (!r.ok) throw new Error(r.error.code);
          const before = g;
          g = r.state;
          if (g.phase !== 'playing') break; // the reveal makes everything public, by design
          for (let viewer = 0; viewer < n; viewer++) {
            const seen = visibleCards(g, viewer, r.events);
            for (let other = 0; other < n; other++) {
              if (other === viewer) continue;
              for (const c of g.seats[other]!.hand) {
                // A card you discarded earlier and they picked up is public knowledge; a card they drew
                // face-down, or were dealt, is not. Check against the dealt/deck-drawn set only.
                const publicPickup =
                  before.discardPile.some((d) => cardId(d) === cardId(c)) ||
                  r.events.some(
                    (e) =>
                      e.type === 'drew' &&
                      e.source === 'discard' &&
                      e.card &&
                      cardId(e.card) === cardId(c),
                  );
                if (!publicPickup) expect(seen.has(cardId(c))).toBe(false);
              }
            }
          }
        }
      }),
      { numRuns: 40 },
    );
  });

  it('card counts in every view add up to 52', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer({ min: 2, max: 10 }), (seed, n) => {
        const g = startRound(createGame(seats(n), seed)).state;
        for (let viewer = 0; viewer < n; viewer++) {
          const v = viewFor(g, viewer);
          const total =
            v.drawPileCount + v.discardPileCount + v.seats.reduce((a, s) => a + s.cardCount, 0);
          expect(total).toBe(52);
          expect(v.seats[viewer]!.cardCount).toBe(v.hand.length);
        }
      }),
    );
  });
});
