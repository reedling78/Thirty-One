import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  findThirtyOne,
  hasThirtyOne,
  isStraight,
  isTrips,
  makeDeck,
  parseCards,
  parseHand,
  scoreHand,
  seedRng,
  shuffle,
  threeCardCombinations,
  type Hand,
  type HandKind,
  type Suit,
} from '../src/index';

type Row = [hand: string, total: number, kind: HandKind, suit: Suit | null, why: string];

/** Every row of the example-hands table in Rules.md, plus the edge cases it calls out. */
const EXAMPLE_HANDS: Row[] = [
  ['2c 10c 2d', 12, 'suited', 'clubs', 'Clubs: 2 + 10. The 2♦ is off-suit.'],
  ['2h 10c 9d', 10, 'suited', 'clubs', 'No two cards share a suit; best single card is the 10♣.'],
  ['Kh 6c Qh', 20, 'suited', 'hearts', 'Hearts: 10 + 10.'],
  [
    'Kh Ah Qh',
    31,
    'thirtyOne',
    'hearts',
    'Hearts: 10 + 11 + 10 — instant win, and better than the straight reading.',
  ],
  ['3h 3c 3d', 30, 'trips', null, 'Three of a kind.'],
  ['3h 4h 5h', 30, 'straight', 'hearts', 'Straight in hearts.'],
  [
    'As 2s 3s',
    30,
    'straight',
    'spades',
    'Straight, Ace low — beats the 16 it would score as suited cards.',
  ],
];

describe('scoreHand — example hands from Rules', () => {
  it.each(EXAMPLE_HANDS)('%s scores %i (%s)', (hand, total, kind, suit) => {
    expect(scoreHand(parseHand(hand))).toEqual({ total, kind, suit });
  });
});

describe('scoreHand — edge cases', () => {
  it('suited Q-K-A reads as 31, not as a 30 straight', () => {
    expect(scoreHand(parseHand('Qd Kd Ad'))).toEqual({
      total: 31,
      kind: 'thirtyOne',
      suit: 'diamonds',
    });
  });

  it('unsuited Q-K-A is just the best single card', () => {
    expect(scoreHand(parseHand('Qd Kh As'))).toEqual({ total: 11, kind: 'suited', suit: 'spades' });
  });

  it('trips of aces is 30, not 33', () => {
    expect(scoreHand(parseHand('Ah Ac Ad'))).toEqual({ total: 30, kind: 'trips', suit: null });
  });

  it('K-A-2 suited is not a straight — Ace is high or low, never both', () => {
    const hand = parseHand('Kc Ac 2c');
    expect(isStraight(hand)).toBe(false);
    expect(scoreHand(hand)).toEqual({ total: 23, kind: 'suited', suit: 'clubs' });
  });

  it('a sequence in mixed suits is not a straight', () => {
    expect(isStraight(parseHand('3h 4c 5h'))).toBe(false);
    expect(scoreHand(parseHand('3h 4c 5h'))).toEqual({ total: 8, kind: 'suited', suit: 'hearts' });
  });

  it('a suited 30 that is not a straight is plain suited', () => {
    expect(scoreHand(parseHand('10s Qs Ks'))).toEqual({
      total: 30,
      kind: 'suited',
      suit: 'spades',
    });
  });

  it('three ten-value cards suited is 30, and never 31 without an Ace', () => {
    expect(scoreHand(parseHand('10h Jh Qh'))).toEqual({
      total: 30,
      kind: 'straight',
      suit: 'hearts',
    });
    expect(scoreHand(parseHand('Jh Qh Kh')).total).toBe(30);
  });

  it('two cards in one suit beats one higher card in another', () => {
    // Hearts 2 + 3 = 5 vs a lone K♠ = 10: the lone King wins.
    expect(scoreHand(parseHand('2h 3h Ks'))).toEqual({ total: 10, kind: 'suited', suit: 'spades' });
    // Hearts 9 + 2 = 11 vs a lone K♠ = 10: the pair wins.
    expect(scoreHand(parseHand('9h 2h Ks'))).toEqual({ total: 11, kind: 'suited', suit: 'hearts' });
  });

  it('isTrips and isStraight are independent of card order', () => {
    expect(isTrips(parseHand('7c 7h 7s'))).toBe(true);
    expect(isStraight(parseHand('5d 3d 4d'))).toBe(true);
    expect(isStraight(parseHand('Ad Kd Qd'))).toBe(true);
    expect(isStraight(parseHand('2d Ad 3d'))).toBe(true);
  });
});

describe('31 on more than three cards', () => {
  it('finds 31 inside a four-card hand after a draw', () => {
    const four = parseCards('Kh 6c Qh Ah');
    expect(hasThirtyOne(four)).toBe(true);
    const found = findThirtyOne(four)!;
    expect([...found].map((c) => c.rank).sort()).toEqual(['A', 'K', 'Q']);
    expect(found.every((c) => c.suit === 'hearts')).toBe(true);
  });

  it('does not invent 31 from three cards that merely sum past 31 across suits', () => {
    expect(hasThirtyOne(parseCards('Kh Qd Ah As'))).toBe(false);
    expect(findThirtyOne(parseCards('2c 3c 4c 5c'))).toBeNull();
  });

  it('four cards have exactly four three-card combinations', () => {
    expect(threeCardCombinations(parseCards('2c 3c 4c 5c'))).toHaveLength(4);
    expect(threeCardCombinations(parseCards('2c 3c 4c'))).toHaveLength(1);
  });
});

describe('scoreHand — properties', () => {
  const anyHand = fc.integer().map((seed): Hand => {
    const { items } = shuffle(makeDeck(), seedRng(seed));
    return [items[0]!, items[1]!, items[2]!];
  });

  it('totals are always between 2 and 31, and 31 only for thirtyOne', () => {
    fc.assert(
      fc.property(anyHand, (hand) => {
        const s = scoreHand(hand);
        expect(s.total).toBeGreaterThanOrEqual(2);
        expect(s.total).toBeLessThanOrEqual(31);
        expect(s.total === 31).toBe(s.kind === 'thirtyOne');
        expect(s.total >= 30).toBe(s.kind !== 'suited' || s.total === 30);
      }),
    );
  });

  it('is independent of card order', () => {
    fc.assert(
      fc.property(anyHand, (hand) => {
        const [a, b, c] = hand;
        expect(scoreHand([c, a, b])).toEqual(scoreHand(hand));
        expect(scoreHand([b, c, a])).toEqual(scoreHand(hand));
      }),
    );
  });

  it('hasThirtyOne on three cards agrees with scoreHand', () => {
    fc.assert(
      fc.property(anyHand, (hand) => {
        expect(hasThirtyOne(hand)).toBe(scoreHand(hand).total === 31);
      }),
    );
  });

  it('a carrying suit is reported for everything except trips', () => {
    fc.assert(
      fc.property(anyHand, (hand) => {
        const s = scoreHand(hand);
        if (s.kind === 'trips') expect(s.suit).toBeNull();
        else expect(hand.some((c) => c.suit === s.suit)).toBe(true);
      }),
    );
  });
});
