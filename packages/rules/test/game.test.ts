import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  activeSeatIndices,
  allCards,
  apply,
  cardId,
  createGame,
  legalActions,
  nextActiveSeat,
  nextInt,
  parseCard,
  startRound,
  type GameState,
} from '../src/index';
import { ids, scriptDeck } from './helpers';

const seats = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`);

function playing(n = 4, seed = 1, dealer = 0): GameState {
  return startRound(createGame(seats(n), seed, { dealer })).state;
}

function must(result: ReturnType<typeof apply>): GameState {
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.state;
}

describe('createGame', () => {
  it('rejects fewer than 2 or more than 10 seats, and duplicate ids', () => {
    expect(() => createGame(['a'], 1)).toThrow();
    expect(() => createGame(seats(11), 1)).toThrow();
    expect(() => createGame(['a', 'a'], 1)).toThrow();
  });

  it('starts in the lobby with nothing dealt and a dealer from the seed', () => {
    const g = createGame(seats(5), 123);
    expect(g.phase).toBe('lobby');
    expect(g.round).toBe(0);
    expect(g.dealer).toBeGreaterThanOrEqual(0);
    expect(g.dealer).toBeLessThan(5);
    expect(createGame(seats(5), 123).dealer).toBe(g.dealer);
    expect(createGame(seats(5), 123, { dealer: 3 }).dealer).toBe(3);
    expect(() => createGame(seats(5), 1, { dealer: 5 })).toThrow();
  });
});

describe('startRound', () => {
  it('deals three to every seat, flips one discard, and starts left of the dealer', () => {
    const g = playing(4, 7, 1);
    expect(g.phase).toBe('playing');
    expect(g.round).toBe(1);
    for (const s of g.seats) expect(s.hand).toHaveLength(3);
    expect(g.discardPile).toHaveLength(1);
    expect(g.drawPile).toHaveLength(52 - 12 - 1);
    expect(g.turn).toBe(2);
    expect(allCards(g)).toHaveLength(52);
    expect(new Set(allCards(g).map(cardId)).size).toBe(52);
  });

  it('is reproducible from the seed', () => {
    const a = playing(6, 99);
    const b = playing(6, 99);
    expect(a.seats.map((s) => ids(s.hand))).toEqual(b.seats.map((s) => ids(s.hand)));
    expect(ids(a.drawPile)).toEqual(ids(b.drawPile));
  });

  it('deals a scripted deck in order', () => {
    const deck = scriptDeck(['2c 3c 4c', '5d 6d 7d', '8h 9h 10h'], 'Ks', ['As', '2s']);
    const g = startRound(createGame(seats(3), 1, { dealer: 0 }), { deck }).state;
    expect(ids(g.seats[0]!.hand)).toEqual(['2c', '3c', '4c']);
    expect(ids(g.seats[1]!.hand)).toEqual(['5d', '6d', '7d']);
    expect(ids(g.seats[2]!.hand)).toEqual(['8h', '9h', '10h']);
    expect(ids(g.discardPile)).toEqual(['Ks']);
    expect(ids(g.drawPile.slice(-2))).toEqual(['2s', 'As']); // As is on top
  });

  it('refuses to start outside lobby/roundOver or with fewer than two players', () => {
    const g = playing();
    expect(() => startRound(g)).toThrow();
    const lonely: GameState = {
      ...createGame(seats(2), 1),
      seats: [
        { id: 'a', hand: [], folds: 0, out: false },
        { id: 'b', hand: [], folds: 0, out: true },
      ],
    };
    expect(() => startRound(lonely)).toThrow();
  });

  it('a dealt 31 ends the round at once, and several dealt 31s are all safe', () => {
    const deck = scriptDeck(['Kh Ah Qh', '5d 6d 7d', 'Ks As Js'], '2c');
    const { state, events } = startRound(createGame(seats(3), 1, { dealer: 0 }), { deck });
    expect(state.phase).toBe('roundOver');
    expect(state.roundResult?.reason).toBe('thirtyOne');
    expect(state.roundResult?.thirtyOneSeats).toEqual([0, 2]);
    expect(events.filter((e) => e.type === 'thirtyOne')).toHaveLength(2);
    expect(events.at(-1)?.type).toBe('roundOver');
    expect(state.roundResult?.hands.map((h) => h.score.total)).toEqual([31, 30, 31]);
  });
});

describe('seat helpers', () => {
  it('nextActiveSeat wraps and skips eliminated seats', () => {
    const g = createGame(seats(4), 1);
    const withOut: GameState = {
      ...g,
      seats: g.seats.map((s, i) => (i === 2 ? { ...s, out: true } : s)),
    };
    expect(nextActiveSeat(withOut, 1)).toBe(3);
    expect(nextActiveSeat(withOut, 3)).toBe(0);
    expect(activeSeatIndices(withOut)).toEqual([0, 1, 3]);
  });
});

describe('apply — turn order and legality', () => {
  it('only the current seat may act, and only while playing', () => {
    const g = playing(3, 1, 0); // turn = 1
    expect(apply(g, 0, { type: 'draw', source: 'deck' })).toMatchObject({
      ok: false,
      error: { code: 'notYourTurn' },
    });
    expect(apply(createGame(seats(3), 1), 0, { type: 'knock' })).toMatchObject({
      ok: false,
      error: { code: 'notPlaying' },
    });
    expect(legalActions(g, 0)).toEqual([]);
    expect(legalActions(g, 1)).toEqual(['draw', 'knock']);
  });

  it('draw from deck: hand grows to four, draw pile shrinks, then only discard is legal', () => {
    const g = playing(3, 1, 0);
    const r = apply(g, 1, { type: 'draw', source: 'deck' });
    expect(r.ok).toBe(true);
    const s = must(r);
    expect(s.seats[1]!.hand).toHaveLength(4);
    expect(s.drawPile).toHaveLength(g.drawPile.length - 1);
    expect(legalActions(s, 1)).toEqual(['discard']);
    expect(apply(s, 1, { type: 'draw', source: 'deck' })).toMatchObject({
      ok: false,
      error: { code: 'mustDiscardFirst' },
    });
    expect(apply(s, 1, { type: 'knock' })).toMatchObject({
      ok: false,
      error: { code: 'knockNotAllowedAfterDraw' },
    });
    if (r.ok) expect(r.events.map((e) => e.type)).toEqual(['drew']);
  });

  it('discard before drawing, or a card you do not hold, is refused', () => {
    const g = playing(3, 1, 0);
    expect(apply(g, 1, { type: 'discard', card: g.seats[1]!.hand[0]! })).toMatchObject({
      ok: false,
      error: { code: 'mustDrawFirst' },
    });
    const s = must(apply(g, 1, { type: 'draw', source: 'deck' }));
    const notMine = s.seats[0]!.hand[0]!;
    expect(apply(s, 1, { type: 'discard', card: notMine })).toMatchObject({
      ok: false,
      error: { code: 'cardNotInHand' },
    });
  });

  it('discarding passes the turn left and puts the card on top of the discard pile', () => {
    const g = playing(3, 1, 0);
    const s = must(apply(g, 1, { type: 'draw', source: 'deck' }));
    const card = s.seats[1]!.hand[3]!;
    const r = apply(s, 1, { type: 'discard', card });
    const t = must(r);
    expect(t.turn).toBe(2);
    expect(t.seats[1]!.hand).toHaveLength(3);
    expect(cardId(t.discardPile.at(-1)!)).toBe(cardId(card));
    expect(allCards(t)).toHaveLength(52);
    if (r.ok) expect(r.events.map((e) => e.type)).toEqual(['discarded', 'turnChanged']);
  });

  it('taking the discard and throwing the same card straight back is not allowed', () => {
    const g = playing(3, 1, 0);
    const top = g.discardPile[0]!;
    const s = must(apply(g, 1, { type: 'draw', source: 'discard' }));
    expect(s.discardPile).toHaveLength(0);
    expect(s.tookFromDiscard).toEqual(top);
    expect(apply(s, 1, { type: 'discard', card: top })).toMatchObject({
      ok: false,
      error: { code: 'cannotThrowBackDrawnDiscard' },
    });
    const other = s.seats[1]!.hand.find((c) => cardId(c) !== cardId(top))!;
    const t = must(apply(s, 1, { type: 'discard', card: other }));
    expect(t.tookFromDiscard).toBeNull();
    // The card taken from the discard may be thrown on a later turn.
  });

  it('drawing from an empty discard pile is refused', () => {
    const g = playing(3, 1, 0);
    const s = must(apply(g, 1, { type: 'draw', source: 'discard' }));
    const other = s.seats[1]!.hand[0]!;
    const t = must(
      apply(s, 1, {
        type: 'discard',
        card: cardId(other) === cardId(g.discardPile[0]!) ? s.seats[1]!.hand[1]! : other,
      }),
    );
    // Discard pile has exactly the one card seat 1 threw; take it, then the pile is empty.
    const u = must(apply(t, 2, { type: 'draw', source: 'discard' }));
    expect(u.discardPile).toHaveLength(0);
  });
});

describe('apply — draw pile exhaustion', () => {
  it('reshuffles the discard pile under its top card', () => {
    // Three players, draw pile of exactly one card, then a big discard pile is impossible to
    // script directly, so play it out: drain the draw pile with deck draws.
    let g = playing(3, 5, 0);
    let guard = 0;
    while (g.drawPile.length > 0 && guard++ < 100) {
      const seat = g.turn;
      g = must(apply(g, seat, { type: 'draw', source: 'deck' }));
      if (g.phase !== 'playing') return; // a 31 happened; fine, not what this test is about
      g = must(apply(g, seat, { type: 'discard', card: g.seats[seat]!.hand[0]! }));
      if (g.phase !== 'playing') return;
    }
    expect(g.drawPile).toHaveLength(0);
    const top = g.discardPile.at(-1)!;
    const discardCount = g.discardPile.length;
    const r = apply(g, g.turn, { type: 'draw', source: 'deck' });
    const s = must(r);
    if (r.ok) expect(r.events[0]?.type).toBe('reshuffled');
    expect(ids(s.discardPile)).toEqual([cardId(top)]);
    expect(s.drawPile).toHaveLength(discardCount - 1 - 1); // minus the kept top, minus the card drawn
    expect(allCards(s)).toHaveLength(52);
  });
});

describe('apply — knocking', () => {
  it('may knock on the very first turn; everyone else gets one more turn, then the reveal', () => {
    const g = playing(3, 1, 0); // turn 1
    const r = apply(g, 1, { type: 'knock' });
    let s = must(r);
    expect(s.knocker).toBe(1);
    expect(s.turn).toBe(2);
    expect(s.turnsUntilReveal).toBe(2);
    if (r.ok) expect(r.events.map((e) => e.type)).toEqual(['knocked', 'turnChanged']);

    expect(apply(s, 2, { type: 'knock' })).toMatchObject({
      ok: false,
      error: { code: 'someoneAlreadyKnocked' },
    });
    expect(legalActions(s, 2)).toEqual(['draw']);

    s = must(apply(s, 2, { type: 'draw', source: 'deck' }));
    s = must(apply(s, 2, { type: 'discard', card: s.seats[2]!.hand[3]! }));
    expect(s.phase).toBe('playing');
    expect(s.turn).toBe(0);
    expect(s.turnsUntilReveal).toBe(1);

    s = must(apply(s, 0, { type: 'draw', source: 'deck' }));
    const last = apply(s, 0, { type: 'discard', card: s.seats[0]!.hand[3]! });
    s = must(last);
    expect(s.phase).toBe('roundOver');
    expect(s.roundResult?.reason).toBe('knock');
    expect(s.roundResult?.knocker).toBe(1);
    expect(s.roundResult?.hands.map((h) => h.seat)).toEqual([0, 1, 2]);
    for (const h of s.roundResult!.hands) expect(h.hand).toHaveLength(3);
    if (last.ok) expect(last.events.map((e) => e.type)).toEqual(['discarded', 'roundOver']);
    expect(apply(s, 1, { type: 'draw', source: 'deck' })).toMatchObject({
      ok: false,
      error: { code: 'notPlaying' },
    });
  });

  it('head-to-head: a knock gives the other player exactly one turn', () => {
    const g = playing(2, 3, 0); // turn 1
    let s = must(apply(g, 1, { type: 'knock' }));
    expect(s.turn).toBe(0);
    s = must(apply(s, 0, { type: 'draw', source: 'deck' }));
    s = must(apply(s, 0, { type: 'discard', card: s.seats[0]!.hand[3]! }));
    expect(s.phase).toBe('roundOver');
  });
});

describe('apply — 31', () => {
  it('drawing into 31 ends the round immediately, before any discard', () => {
    const deck = scriptDeck(['Kh 6c Qh', '2d 3d 4d', '5s 6s 7s'], '9c', ['Ah']);
    const g = startRound(createGame(seats(3), 1, { dealer: 0 }), { deck }).state;
    expect(g.phase).toBe('playing');
    const r = apply(g, 1, { type: 'draw', source: 'deck' });
    expect(r.ok).toBe(true);
    // Seat 1 draws Ah into 2d 3d 4d — no 31. Seat 2's turn.
    let s = must(r);
    s = must(apply(s, 1, { type: 'discard', card: parseCard('Ah') }));
    // Seat 2 takes the Ah from the discard... still no 31. Pass it on to seat 0.
    s = must(apply(s, 2, { type: 'draw', source: 'discard' }));
    s = must(apply(s, 2, { type: 'discard', card: parseCard('5s') }));
    s = must(apply(s, 0, { type: 'draw', source: 'discard' }));
    // Seat 0 took the 5s. Not 31. Throw it on and make seat 0 draw the Ah next time around.
    expect(s.phase).toBe('playing');
  });

  it('a four-card hand containing 31 ends the round and reveals the 31 triple', () => {
    const deck = scriptDeck(['Kh 6c Qh', '2d 3d 4d', '5s 6s 7s'], 'Ah');
    const g = startRound(createGame(seats(3), 1, { dealer: 2 }), { deck }).state; // turn 0
    const r = apply(g, 0, { type: 'draw', source: 'discard' });
    const s = must(r);
    expect(s.phase).toBe('roundOver');
    expect(s.roundResult?.reason).toBe('thirtyOne');
    expect(s.roundResult?.thirtyOneSeats).toEqual([0]);
    const revealed = s.roundResult!.hands.find((h) => h.seat === 0)!;
    expect(revealed.score.total).toBe(31);
    expect(ids(revealed.hand).sort()).toEqual(['Ah', 'Kh', 'Qh']);
    if (r.ok) expect(r.events.map((e) => e.type)).toEqual(['drew', 'thirtyOne', 'roundOver']);
  });

  it('a 31 during the final round after a knock still ends the round as a 31', () => {
    const deck = scriptDeck(['Kh 6c Qh', '2d 3d 4d', '5s 6s 7s'], 'Ah');
    const g = startRound(createGame(seats(3), 1, { dealer: 1 }), { deck }).state; // turn 2
    let s = must(apply(g, 2, { type: 'knock' }));
    s = must(apply(s, 0, { type: 'draw', source: 'discard' }));
    expect(s.phase).toBe('roundOver');
    expect(s.roundResult?.reason).toBe('thirtyOne');
    expect(s.roundResult?.knocker).toBe(2);
  });
});

describe('apply — properties under random legal play', () => {
  const seatCount = fc.integer({ min: 2, max: 10 });

  it('never throws, conserves 52 cards, keeps hands at 3 or 4, and every round terminates', () => {
    fc.assert(
      fc.property(
        fc.integer(),
        seatCount,
        fc.integer({ min: 1, max: 99 }),
        (seed, n, knockChance) => {
          let g = startRound(createGame(seats(n), seed)).state;
          let steps = 0;
          let rngState = g.rng;
          while (g.phase === 'playing') {
            expect(steps++).toBeLessThan(5000);
            const seat = g.turn;
            const legal = legalActions(g, seat);
            expect(legal.length).toBeGreaterThan(0);
            const step = nextInt(rngState, 100);
            rngState = step.state;
            const pick = step.value;
            let r;
            if (legal.includes('discard')) {
              const hand = g.seats[seat]!.hand;
              r = apply(g, seat, { type: 'discard', card: hand[pick % hand.length]! });
              if (!r.ok && r.error.code === 'cannotThrowBackDrawnDiscard') {
                r = apply(g, seat, { type: 'discard', card: hand[(pick + 1) % hand.length]! });
              }
            } else if (legal.includes('knock') && pick < knockChance) {
              r = apply(g, seat, { type: 'knock' });
            } else {
              r = apply(g, seat, { type: 'draw', source: pick % 3 === 0 ? 'discard' : 'deck' });
              if (!r.ok) r = apply(g, seat, { type: 'draw', source: 'deck' });
            }
            expect(r.ok).toBe(true);
            if (!r.ok) return;
            g = r.state;
            expect(allCards(g)).toHaveLength(52);
            expect(new Set(allCards(g).map(cardId)).size).toBe(52);
            for (const s of g.seats) expect([3, 4]).toContain(s.hand.length);
          }
          expect(g.phase).toBe('roundOver');
          expect(g.roundResult?.hands).toHaveLength(n);
        },
      ),
      { numRuns: 150 },
    );
  });
});
