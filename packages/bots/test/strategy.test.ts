import {
  apply,
  cardId,
  createGame,
  parseCard,
  parseCards,
  seedRng,
  startRound,
  viewFor,
  type GameState,
  type PlayerView,
} from '@thirtyone/rules';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  EASY,
  NORMAL,
  bestDiscard,
  discardImproves,
  easyBot,
  knockThreshold,
  makeBot,
  normalBot,
} from '../src/index';

function must(result: ReturnType<typeof apply>): GameState {
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.state;
}

const seats = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`);

/** A view with the given hand on turn, holding three cards (draw/knock legal). */
function viewWith(hand: string, overrides: Partial<PlayerView> = {}): PlayerView {
  const g = startRound(createGame(seats(4), 1, { dealer: 3 })).state; // turn 0
  const cards = parseCards(hand);
  const s: GameState = {
    ...g,
    seats: g.seats.map((x, i) => (i === 0 ? { ...x, hand: cards } : x)),
  };
  return { ...viewFor(s, 0), ...overrides };
}

describe('bestDiscard', () => {
  it('throws the card whose loss costs least', () => {
    expect(cardId(bestDiscard(parseCards('Kh Qh 2c 9h'), null))).toBe('2c');
    expect(cardId(bestDiscard(parseCards('Kh Qh 2c 3c'), null))).toMatch(/^[23]c$/);
  });

  it('never throws back the card just taken from the discard pile, even when it is the worst', () => {
    const took = parseCard('2c');
    const choice = bestDiscard(parseCards('Kh Qh 9h 2c'), took);
    expect(cardId(choice)).not.toBe('2c');
    expect(cardId(choice)).toBe('9h');
  });
});

describe('discardImproves', () => {
  it('is true only when taking the top card raises the hand after the forced throw-back', () => {
    expect(discardImproves(parseCards('Kh Qh 2c'), parseCard('9h'))).toBe(true);
    expect(discardImproves(parseCards('Kh Qh 2c'), parseCard('3c'))).toBe(false);
    expect(discardImproves(parseCards('Kh Qh 2c'), parseCard('Ah'))).toBe(true);
    expect(discardImproves(parseCards('Kh Qh Ah'), parseCard('9h'))).toBe(false);
  });
});

describe('knockThreshold', () => {
  it('falls with more players, falls as the round goes on, and never exceeds the cap', () => {
    expect(knockThreshold(NORMAL, 2, 0)).toBe(NORMAL.knockBase);
    expect(knockThreshold(NORMAL, 10, 0)).toBeLessThan(knockThreshold(NORMAL, 2, 0));
    expect(knockThreshold(NORMAL, 4, 8)).toBeLessThan(knockThreshold(NORMAL, 4, 0));
    expect(knockThreshold({ ...NORMAL, knockBase: 99 }, 2, 0)).toBe(NORMAL.maxThreshold);
    expect(knockThreshold(NORMAL, 10, 1000)).toBe(0);
  });
});

describe('normal bot decisions', () => {
  const rng = seedRng(1);

  it('knocks at or above the threshold and draws below it', () => {
    const thirty = viewWith('Kh Qh 10h');
    expect(normalBot.decide(thirty, rng).action).toEqual({ type: 'knock' });
    const low = viewWith('2c 5d 9h');
    expect(normalBot.decide(low, rng).action.type).toBe('draw');
  });

  it('takes the discard when it helps and the deck when it does not', () => {
    const helps = viewWith('Kh Qh 2c', { discardTop: parseCard('9h') });
    expect(normalBot.decide(helps, rng).action).toEqual({ type: 'draw', source: 'discard' });
    const useless = viewWith('Kh Qh 2c', { discardTop: parseCard('3s') });
    expect(normalBot.decide(useless, rng).action).toEqual({ type: 'draw', source: 'deck' });
  });

  it('does not knock when someone already has', () => {
    const v = viewWith('Kh Qh 10h', { legalActions: ['draw'], knocker: 2 });
    expect(normalBot.decide(v, rng).action.type).toBe('draw');
  });

  it('discards when holding four', () => {
    const g = startRound(createGame(seats(3), 1, { dealer: 2 })).state;
    const s = must(apply(g, 0, { type: 'draw', source: 'deck' }));
    const d = normalBot.decide(viewFor(s, 0), rng);
    expect(d.action.type).toBe('discard');
    expect(apply(s, 0, d.action).ok).toBe(true);
  });

  it('refuses to decide for a seat with no legal action', () => {
    const g = startRound(createGame(seats(3), 1, { dealer: 2 })).state;
    expect(() => normalBot.decide(viewFor(g, 1), rng)).toThrow();
  });
});

describe('easy bot', () => {
  it('has a lower bar and noise, but noise never knocks', () => {
    expect(EASY.knockBase).toBeLessThan(NORMAL.knockBase);
    expect(EASY.noise).toBeGreaterThan(0);
    const v = viewWith('2c 5d 9h'); // far below any threshold
    let rng = seedRng(7);
    for (let i = 0; i < 200; i++) {
      const d = easyBot.decide(v, rng);
      rng = d.rng;
      expect(d.action.type).toBe('draw');
    }
  });

  it('is reproducible from its rng state', () => {
    const v = viewWith('Kh Qh 2c', { discardTop: parseCard('3s') });
    expect(easyBot.decide(v, seedRng(3))).toEqual(easyBot.decide(v, seedRng(3)));
  });
});

describe('bots only ever return legal actions', () => {
  it('across whole rounds at any table size, every decision applies cleanly', () => {
    const bots = [normalBot, easyBot, makeBot({ ...NORMAL, name: 'cautious', knockBase: 30 })];
    fc.assert(
      fc.property(fc.integer(), fc.integer({ min: 2, max: 10 }), (seed, n) => {
        let g = startRound(createGame(seats(n), seed)).state;
        let rng = seedRng(seed);
        let steps = 0;
        while (g.phase === 'playing') {
          expect(steps++).toBeLessThan(3000);
          const seat = g.turn;
          const d = bots[seat % bots.length]!.decide(viewFor(g, seat), rng);
          rng = d.rng;
          const r = apply(g, seat, d.action);
          expect(r.ok).toBe(true);
          if (!r.ok) return;
          g = r.state;
        }
        expect(g.phase).toBe('roundOver');
      }),
      { numRuns: 100 },
    );
  });
});
