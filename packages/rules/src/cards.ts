/** Playing cards for Thirty-One: a standard 52-card deck, no jokers. */

export const SUITS = ['clubs', 'diamonds', 'hearts', 'spades'] as const;
export type Suit = (typeof SUITS)[number];

export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;
export type Rank = (typeof RANKS)[number];

export interface Card {
  readonly rank: Rank;
  readonly suit: Suit;
}

/** Exactly three cards — a hand as scored. */
export type Hand = readonly [Card, Card, Card];

/** Point value of a rank: Ace 11, face cards and 10 are 10, the rest face value. */
export function cardValue(rank: Rank): number {
  switch (rank) {
    case 'A':
      return 11;
    case 'K':
    case 'Q':
    case 'J':
    case '10':
      return 10;
    default:
      return Number(rank);
  }
}

/** Position of a rank for straights, Ace low. 'A' is 1, 'K' is 13. */
export function rankIndex(rank: Rank): number {
  return RANKS.indexOf(rank) + 1;
}

/** A fresh, ordered 52-card deck. Shuffle it with `shuffle` from `./rng`. */
export function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) deck.push({ rank, suit });
  }
  return deck;
}

export function sameCard(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit;
}

const SUIT_LETTERS: Record<Suit, string> = { clubs: 'c', diamonds: 'd', hearts: 'h', spades: 's' };
const SUIT_SYMBOLS: Record<Suit, string> = { clubs: '♣', diamonds: '♦', hearts: '♥', spades: '♠' };
const LETTER_TO_SUIT: Record<string, Suit> = {
  c: 'clubs',
  d: 'diamonds',
  h: 'hearts',
  s: 'spades',
  '♣': 'clubs',
  '♦': 'diamonds',
  '♥': 'hearts',
  '♠': 'spades',
};

/** Stable string id, e.g. "Kh", "10c". Suitable as a React key or map key. */
export function cardId(card: Card): string {
  return `${card.rank}${SUIT_LETTERS[card.suit]}`;
}

/** Human form, e.g. "K♥". */
export function cardLabel(card: Card): string {
  return `${card.rank}${SUIT_SYMBOLS[card.suit]}`;
}

/**
 * Parse "Kh", "10c", "A♠", "kd". Case-insensitive.
 * Throws on anything else — this is for fixtures and scripted deals, not user input.
 */
export function parseCard(text: string): Card {
  const m = /^(A|2|3|4|5|6|7|8|9|10|J|Q|K)([cdhs♣♦♥♠])$/i.exec(text.trim());
  if (!m) throw new Error(`Not a card: "${text}"`);
  const rank = m[1]!.toUpperCase() as Rank;
  const suit = LETTER_TO_SUIT[m[2]!.toLowerCase()];
  if (!suit) throw new Error(`Not a card: "${text}"`);
  return { rank, suit };
}

/** Parse a space-separated list, e.g. "Kh Ah Qh". */
export function parseCards(text: string): Card[] {
  return text.trim().split(/\s+/).filter(Boolean).map(parseCard);
}

/** Parse exactly three cards into a Hand. */
export function parseHand(text: string): Hand {
  const cards = parseCards(text);
  if (cards.length !== 3) throw new Error(`A hand is three cards, got ${cards.length}: "${text}"`);
  return cards as unknown as Hand;
}
