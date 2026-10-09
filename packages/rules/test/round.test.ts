import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  activeSeatIndices,
  allCards,
  apply,
  cardId,
  createGame,
  forfeit,
  legalActions,
  nextInt,
  resolveRound,
  startRound,
  type GameState,
} from '../src/index';
import { scriptDeck } from './helpers';

const seats = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`);

function must(result: ReturnType<typeof apply>): GameState {
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.state;
}

/** Start a scripted round; the dealer is the last seat so seat 0 plays first. */
function scripted(
  hands: string[],
  discard: string,
  draws: string[] = [],
  folds: number[] = [],
): GameState {
  let g = createGame(seats(hands.length), 1, { dealer: hands.length - 1 });
  g = { ...g, seats: g.seats.map((s, i) => ({ ...s, folds: folds[i] ?? 0 })) };
  return startRound(g, { deck: scriptDeck(hands, discard, draws) }).state;
}

/** Seat 0 knocks, everyone else draws from the deck and discards their new card. */
function knockRound(g: GameState): GameState {
  let s = must(apply(g, 0, { type: 'knock' }));
  while (s.phase === 'playing') {
    const seat = s.turn;
    s = must(apply(s, seat, { type: 'draw', source: 'deck' }));
    if (s.phase !== 'playing') break;
    s = must(apply(s, seat, { type: 'discard', card: s.seats[seat]!.hand[3]! }));
  }
  return s;
}

const foldsOf = (g: GameState) => g.seats.map((s) => s.folds);
const outOf = (g: GameState) => g.seats.map((s) => s.out);

describe('resolveRound — knock', () => {
  it('the lowest hand folds one corner', () => {
    // Draws are low off-suit cards so nobody improves.
    const g = knockRound(scripted(['Kh Qh 2c', '9d 3c 4s', '5s 6s 7c'], '2d', ['3h', '4h']));
    expect(g.roundResult?.hands.map((h) => h.score.total)).toEqual([20, 9, 11]);
    const { state, events } = resolveRound(g);
    expect(foldsOf(state)).toEqual([0, 1, 0]);
    expect(events.map((e) => e.type)).toEqual(['folded', 'dealerMoved']);
    expect(state.phase).toBe('betweenRounds');
  });

  it('ties for lowest all fold', () => {
    const g = knockRound(scripted(['Kh Qh 2c', '9d 3c 4s', '9s 3h 4c'], '2d', ['5h', '6h']));
    expect(g.roundResult?.hands.map((h) => h.score.total)).toEqual([20, 9, 9]);
    expect(foldsOf(resolveRound(g).state)).toEqual([0, 1, 1]);
  });

  it('a knocker who ends up lowest folds two', () => {
    const g = knockRound(scripted(['9d 3c 4s', 'Kh Qh 2c', '5s 6s 7c'], '2d', ['3h', '4h']));
    expect(g.roundResult?.knocker).toBe(0);
    expect(foldsOf(resolveRound(g).state)).toEqual([2, 0, 0]);
  });

  it('a knocker tied for lowest folds two while the others fold one', () => {
    const g = knockRound(scripted(['9d 3c 4s', 'Kh Qh 2c', '9s 3h 4c'], '2d', ['5h', '6h']));
    expect(foldsOf(resolveRound(g).state)).toEqual([2, 0, 1]);
  });

  it('the dealer moves left and the next round starts left of the new dealer', () => {
    const g = knockRound(scripted(['Kh Qh 2c', '9d 3c 4s', '5s 6s 7c'], '2d', ['3h', '4h']));
    expect(g.dealer).toBe(2);
    const { state } = resolveRound(g);
    expect(state.dealer).toBe(0);
    const next = startRound(state).state;
    expect(next.turn).toBe(1);
    expect(next.round).toBe(2);
    expect(allCards(next)).toHaveLength(52);
  });
});

describe('resolveRound — 31', () => {
  it('everyone except the 31 holder folds one, the holder folds nothing', () => {
    const g = scripted(['Kh 6c Qh', '2d 3d 4d', '5s 6s 7s'], 'Ah');
    const s = must(apply(g, 0, { type: 'draw', source: 'discard' }));
    expect(s.roundResult?.reason).toBe('thirtyOne');
    expect(foldsOf(resolveRound(s).state)).toEqual([0, 1, 1]);
  });

  it('can eliminate several bus riders at once; if it clears the table the hitter wins', () => {
    const g = scripted(['Kh 6c Qh', '2d 3d 4d', '5s 6s 7s'], 'Ah', [], [0, 4, 4]);
    const s = must(apply(g, 0, { type: 'draw', source: 'discard' }));
    const { state, events } = resolveRound(s);
    expect(outOf(state)).toEqual([false, true, true]);
    expect(state.phase).toBe('gameOver');
    expect(state.winner).toBe(0);
    expect(events.map((e) => e.type)).toEqual([
      'folded',
      'eliminated',
      'folded',
      'eliminated',
      'gameWon',
    ]);
  });
});

describe('resolveRound — corners, the bus, and elimination', () => {
  it('the fourth fold puts you on the bus; a loss on the bus puts you out', () => {
    const onBus = knockRound(
      scripted(['Kh Qh 2c', '9d 3c 4s', '5s 6s 7c'], '2d', ['3h', '4h'], [0, 3, 0]),
    );
    const r1 = resolveRound(onBus);
    expect(r1.state.seats[1]).toMatchObject({ folds: 4, out: false });
    expect(r1.events[0]).toMatchObject({ type: 'folded', seat: 1, folds: 4, onBus: true });

    const out = knockRound(
      scripted(['Kh Qh 2c', '9d 3c 4s', '5s 6s 7c'], '2d', ['3h', '4h'], [0, 4, 0]),
    );
    const r2 = resolveRound(out);
    expect(r2.state.seats[1]).toMatchObject({ folds: 4, out: true });
    expect(r2.events.map((e) => e.type)).toEqual(['folded', 'eliminated', 'dealerMoved']);
    expect(r2.state.phase).toBe('betweenRounds');
    expect(activeSeatIndices(r2.state)).toEqual([0, 2]);
  });

  it('a losing knocker with one corner left is out; with two left they land on the bus', () => {
    const oneLeft = knockRound(
      scripted(['9d 3c 4s', 'Kh Qh 2c', '5s 6s 7c'], '2d', ['3h', '4h'], [3, 0, 0]),
    );
    expect(resolveRound(oneLeft).state.seats[0]).toMatchObject({ folds: 4, out: true });

    const twoLeft = knockRound(
      scripted(['9d 3c 4s', 'Kh Qh 2c', '5s 6s 7c'], '2d', ['3h', '4h'], [2, 0, 0]),
    );
    expect(resolveRound(twoLeft).state.seats[0]).toMatchObject({ folds: 4, out: false });
  });

  it('the game ends with a winner when one player remains', () => {
    const g = knockRound(scripted(['Kh Qh 2c', '9d 3c 4s'], '2d', ['3h'], [0, 4]));
    const { state, events } = resolveRound(g);
    expect(state.phase).toBe('gameOver');
    expect(state.winner).toBe(0);
    expect(events.at(-1)).toEqual({ type: 'gameWon', seat: 0 });
    expect(() => startRound(state)).toThrow();
  });

  it('a round that would eliminate everyone is replayed and nobody folds', () => {
    // Head to head, both on the bus, tied lowest — even the knocker's double fold cannot save it.
    const g = knockRound(scripted(['9d 3c 4s', '9s 3h 4c'], '2d', ['5h'], [4, 4]));
    expect(g.roundResult?.hands.map((h) => h.score.total)).toEqual([9, 9]);
    const { state, events } = resolveRound(g);
    expect(events).toEqual([{ type: 'roundReplayed' }]);
    expect(foldsOf(state)).toEqual([4, 4]);
    expect(outOf(state)).toEqual([false, false]);
    expect(state.phase).toBe('betweenRounds');
    expect(startRound(state).state.phase).toBe('playing');
  });

  it('refuses to resolve outside roundOver', () => {
    expect(() => resolveRound(createGame(seats(2), 1))).toThrow();
  });
});

describe('forfeit', () => {
  it('a player who is not on turn leaves, cards go to the draw pile, play continues around them', () => {
    const g = scripted(['Kh Qh 2c', '9d 3c 4s', '5s 6s 7c'], '2d'); // turn 0
    const { state, events } = forfeit(g, 2);
    expect(events).toEqual([{ type: 'forfeited', seat: 2 }]);
    expect(state.seats[2]).toMatchObject({ out: true, hand: [] });
    expect(allCards(state)).toHaveLength(52);
    expect(state.phase).toBe('playing');
    let s = must(apply(state, 0, { type: 'draw', source: 'deck' }));
    s = must(apply(s, 0, { type: 'discard', card: s.seats[0]!.hand[3]! }));
    expect(s.turn).toBe(1);
    s = must(apply(s, 1, { type: 'draw', source: 'deck' }));
    s = must(apply(s, 1, { type: 'discard', card: s.seats[1]!.hand[3]! }));
    expect(s.turn).toBe(0); // skips seat 2
  });

  it('a player on turn holding four cards leaves and the turn passes on', () => {
    const g = scripted(['Kh Qh 2c', '9d 3c 4s', '5s 6s 7c'], '2d');
    const s = must(apply(g, 0, { type: 'draw', source: 'discard' }));
    const { state } = forfeit(s, 0);
    expect(state.turn).toBe(1);
    expect(state.tookFromDiscard).toBeNull();
    expect(state.discardPile).toHaveLength(0);
    expect(allCards(state)).toHaveLength(52);
  });

  it('a knock in progress stands; a leaver owed a turn is dropped from the list', () => {
    const g = scripted(['Kh Qh 2c', '9d 3c 4s', '5s 6s 7c', '8h 8c 8d'], '2d', ['3h', '4h', '5h']);
    let s = must(apply(g, 0, { type: 'knock' }));
    expect(s.pendingAfterKnock).toEqual([1, 2, 3]);
    s = forfeit(s, 2).state;
    expect(s.pendingAfterKnock).toEqual([1, 3]);
    expect(s.turn).toBe(1);
    s = must(apply(s, 1, { type: 'draw', source: 'deck' }));
    s = must(apply(s, 1, { type: 'discard', card: s.seats[1]!.hand[3]! }));
    expect(s.turn).toBe(3);
    s = must(apply(s, 3, { type: 'draw', source: 'deck' }));
    s = must(apply(s, 3, { type: 'discard', card: s.seats[3]!.hand[3]! }));
    expect(s.phase).toBe('roundOver');
    expect(s.roundResult?.hands.map((h) => h.seat)).toEqual([0, 1, 3]);
  });

  it('the last player owed a turn leaving triggers the reveal immediately', () => {
    const g = scripted(['Kh Qh 2c', '9d 3c 4s', '5s 6s 7c'], '2d', ['3h']);
    let s = must(apply(g, 0, { type: 'knock' }));
    s = must(apply(s, 1, { type: 'draw', source: 'deck' }));
    s = must(apply(s, 1, { type: 'discard', card: s.seats[1]!.hand[3]! }));
    expect(s.turn).toBe(2);
    const { state, events } = forfeit(s, 2);
    expect(state.phase).toBe('roundOver');
    expect(events.map((e) => e.type)).toEqual(['forfeited', 'roundOver']);
  });

  it('a knocker who leaves: the round still completes and nobody pays the knocker penalty', () => {
    const g = scripted(['9d 3c 4s', 'Kh Qh 2c', '9s 3h 4c'], '2d', ['5h', '6h']);
    let s = must(apply(g, 0, { type: 'knock' }));
    s = forfeit(s, 0).state;
    expect(s.knocker).toBe(0);
    s = must(apply(s, 1, { type: 'draw', source: 'deck' }));
    s = must(apply(s, 1, { type: 'discard', card: s.seats[1]!.hand[3]! }));
    s = must(apply(s, 2, { type: 'draw', source: 'deck' }));
    s = must(apply(s, 2, { type: 'discard', card: s.seats[2]!.hand[3]! }));
    expect(s.phase).toBe('roundOver');
    const { state } = resolveRound(s);
    expect(foldsOf(state)).toEqual([0, 0, 1]); // seat 2 was lowest among those left; one corner, not two
    expect(state.seats[0]!.out).toBe(true);
  });

  it('a table left with one player ends with no winner', () => {
    const g = scripted(['Kh Qh 2c', '9d 3c 4s'], '2d');
    const { state, events } = forfeit(g, 1);
    expect(state.phase).toBe('gameOver');
    expect(state.winner).toBeNull();
    expect(events.map((e) => e.type)).toEqual(['forfeited', 'gameAbandoned']);
    expect(() => forfeit(state, 0)).toThrow();
  });

  it('works between rounds too', () => {
    const g = knockRound(scripted(['Kh Qh 2c', '9d 3c 4s', '5s 6s 7c'], '2d', ['3h', '4h']));
    const between = resolveRound(g).state;
    const { state } = forfeit(between, 1);
    expect(state.phase).toBe('betweenRounds');
    expect(activeSeatIndices(state)).toEqual([0, 2]);
    expect(startRound(state).state.seats.map((s) => s.hand.length)).toEqual([3, 0, 3]);
  });

  it('rejects a seat that is already out', () => {
    const g = scripted(['Kh Qh 2c', '9d 3c 4s', '5s 6s 7c'], '2d');
    const s = forfeit(g, 2).state;
    expect(() => forfeit(s, 2)).toThrow();
  });
});

describe('whole games under random legal play', () => {
  it('always ends with exactly one winner, conserving 52 cards throughout', () => {
    fc.assert(
      fc.property(
        fc.integer(),
        fc.integer({ min: 2, max: 10 }),
        fc.integer({ min: 1, max: 60 }),
        (seed, n, knockChance) => {
          let g = startRound(createGame(seats(n), seed)).state;
          let rng = g.rng;
          let rounds = 1;
          let steps = 0;
          while (g.phase !== 'gameOver') {
            expect(steps++).toBeLessThan(20000);
            if (g.phase === 'roundOver') {
              g = resolveRound(g).state;
              continue;
            }
            if (g.phase === 'betweenRounds') {
              g = startRound(g).state;
              rounds++;
              expect(rounds).toBeLessThan(500);
              continue;
            }
            const seat = g.turn;
            const legal = legalActions(g, seat);
            const step = nextInt(rng, 100);
            rng = step.state;
            const pick = step.value;
            let r;
            if (legal.includes('discard')) {
              const hand = g.seats[seat]!.hand;
              r = apply(g, seat, { type: 'discard', card: hand[pick % hand.length]! });
              if (!r.ok)
                r = apply(g, seat, { type: 'discard', card: hand[(pick + 1) % hand.length]! });
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
            for (const s of g.seats) expect(s.folds).toBeLessThanOrEqual(4);
          }
          expect(g.winner).not.toBeNull();
          expect(activeSeatIndices(g)).toEqual([g.winner]);
          expect(new Set(allCards(g).map(cardId)).size).toBe(52);
        },
      ),
      { numRuns: 60 },
    );
  });

  it('the same seed always produces the same game', () => {
    const play = (seed: number) => {
      let g = startRound(createGame(seats(4), seed)).state;
      let rng = g.rng;
      const log: string[] = [];
      while (g.phase !== 'gameOver') {
        if (g.phase === 'roundOver') {
          g = resolveRound(g).state;
          continue;
        }
        if (g.phase === 'betweenRounds') {
          g = startRound(g).state;
          continue;
        }
        const seat = g.turn;
        const step = nextInt(rng, 100);
        rng = step.state;
        const legal = legalActions(g, seat);
        const r = legal.includes('discard')
          ? apply(g, seat, { type: 'discard', card: g.seats[seat]!.hand[step.value % 4]! })
          : step.value < 10 && legal.includes('knock')
            ? apply(g, seat, { type: 'knock' })
            : apply(g, seat, { type: 'draw', source: 'deck' });
        if (!r.ok) {
          g = must(apply(g, seat, { type: 'discard', card: g.seats[seat]!.hand[0]! }));
          continue;
        }
        g = r.state;
        log.push(
          r.events.map((e) => e.type + ('card' in e ? cardId(e.card as never) : '')).join(','),
        );
      }
      return { winner: g.winner, log };
    };
    expect(play(2024)).toEqual(play(2024));
    expect(play(2024).log.length).toBeGreaterThan(5);
  });
});
