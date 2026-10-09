import { describe, expect, it } from 'vitest';
import {
  cardId,
  cardLabel,
  cardValue,
  makeDeck,
  parseCard,
  parseCards,
  parseHand,
  rankIndex,
  RANKS,
  SUITS,
} from '../src/index';

describe('deck', () => {
  it('has 52 unique cards, 13 per suit', () => {
    const deck = makeDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map(cardId)).size).toBe(52);
    for (const suit of SUITS) expect(deck.filter((c) => c.suit === suit)).toHaveLength(13);
  });
});

describe('card values', () => {
  it('Ace is 11, face cards and ten are 10, the rest face value', () => {
    expect(cardValue('A')).toBe(11);
    for (const r of ['K', 'Q', 'J', '10'] as const) expect(cardValue(r)).toBe(10);
    for (const r of ['2', '3', '4', '5', '6', '7', '8', '9'] as const)
      expect(cardValue(r)).toBe(Number(r));
  });

  it('rank index runs Ace-low from 1 to 13', () => {
    expect(RANKS.map(rankIndex)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
  });
});

describe('parsing and formatting', () => {
  it('round-trips ids and labels', () => {
    const c = parseCard('10h');
    expect(c).toEqual({ rank: '10', suit: 'hearts' });
    expect(cardId(c)).toBe('10h');
    expect(cardLabel(c)).toBe('10♥');
    expect(parseCard('A♠')).toEqual({ rank: 'A', suit: 'spades' });
    expect(parseCard('kD')).toEqual({ rank: 'K', suit: 'diamonds' });
  });

  it('parses lists and hands', () => {
    expect(parseCards('Kh 6c Qh')).toHaveLength(3);
    expect(parseHand('Kh 6c Qh')[2]).toEqual({ rank: 'Q', suit: 'hearts' });
  });

  it('rejects junk', () => {
    expect(() => parseCard('1h')).toThrow();
    expect(() => parseCard('Kx')).toThrow();
    expect(() => parseHand('Kh 6c')).toThrow();
  });
});
