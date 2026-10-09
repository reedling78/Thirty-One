import { cardValue, rankIndex, SUITS, type Card, type Hand, type Suit } from './cards';

/**
 * How a hand earned its score.
 * - `suited`   — the best single-suit total (anything from 2 to 30)
 * - `trips`    — three of a kind, flat 30
 * - `straight` — three in sequence, same suit, flat 30 (Ace high or low, no wraparound)
 * - `thirtyOne`— Ace + two ten-value cards in one suit. The maximum, and an instant win.
 */
export type HandKind = 'suited' | 'trips' | 'straight' | 'thirtyOne';

export interface HandScore {
  readonly total: number;
  readonly kind: HandKind;
  /** The suit carrying the total. Null for three of a kind, which has no carrying suit. */
  readonly suit: Suit | null;
}

export const THIRTY_ONE = 31;
export const SPECIAL_HAND_SCORE = 30;

interface SuitedBest {
  total: number;
  suit: Suit;
}

function bestSuitedTotal(hand: Hand): SuitedBest {
  const totals = new Map<Suit, number>();
  for (const c of hand) totals.set(c.suit, (totals.get(c.suit) ?? 0) + cardValue(c.rank));
  // Ties between suits (e.g. a lone 9♦ and a lone 9♥) break on SUITS order so the
  // carrying suit never depends on the order the cards are held in.
  let best: SuitedBest | null = null;
  for (const suit of SUITS) {
    const total = totals.get(suit);
    if (total !== undefined && (!best || total > best.total)) best = { total, suit };
  }
  return best!;
}

export function isTrips(hand: Hand): boolean {
  return hand[0].rank === hand[1].rank && hand[1].rank === hand[2].rank;
}

/** Three consecutive ranks in one suit. Ace plays high (Q-K-A) or low (A-2-3), never both. */
export function isStraight(hand: Hand): boolean {
  if (hand[0].suit !== hand[1].suit || hand[1].suit !== hand[2].suit) return false;
  const low = hand.map((c) => rankIndex(c.rank)).sort((a, b) => a - b);
  if (consecutive(low)) return true;
  if (low[0] === 1) {
    const high = [low[1]!, low[2]!, 14].sort((a, b) => a - b);
    return consecutive(high);
  }
  return false;
}

function consecutive(sorted: readonly number[]): boolean {
  return sorted[1] === sorted[0]! + 1 && sorted[2] === sorted[1]! + 1;
}

/**
 * Score exactly three cards, always taking the best reading.
 * A suited Q-K-A is both a straight and 31; it scores 31.
 */
export function scoreHand(hand: Hand): HandScore {
  const suited = bestSuitedTotal(hand);
  if (suited.total === THIRTY_ONE)
    return { total: THIRTY_ONE, kind: 'thirtyOne', suit: suited.suit };
  if (isStraight(hand)) return { total: SPECIAL_HAND_SCORE, kind: 'straight', suit: suited.suit };
  if (isTrips(hand)) return { total: SPECIAL_HAND_SCORE, kind: 'trips', suit: null };
  return { total: suited.total, kind: 'suited', suit: suited.suit };
}

/**
 * Every three-card combination of the given cards. Used to check a four-card
 * hand (after a draw, before the discard) for an instant 31.
 */
export function threeCardCombinations(cards: readonly Card[]): Hand[] {
  const out: Hand[] = [];
  for (let i = 0; i < cards.length; i++)
    for (let j = i + 1; j < cards.length; j++)
      for (let k = j + 1; k < cards.length; k++) out.push([cards[i]!, cards[j]!, cards[k]!]);
  return out;
}

/**
 * The first three cards among `cards` that make 31, or null. Per the rules, 31
 * counts the moment any three cards in hand make it — including while holding
 * four right after a draw — so this accepts any number of cards.
 */
export function findThirtyOne(cards: readonly Card[]): Hand | null {
  for (const hand of threeCardCombinations(cards)) {
    if (scoreHand(hand).total === THIRTY_ONE) return hand;
  }
  return null;
}

export function hasThirtyOne(cards: readonly Card[]): boolean {
  return findThirtyOne(cards) !== null;
}
