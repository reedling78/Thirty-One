import { cardId, cardValue, parseCard, parseCards, scriptedDeck, type Card } from '../src/index';

/** Thin wrapper over the engine's scriptedDeck that takes card shorthand. */
export function scriptDeck(hands: string[], discard: string, drawOrder: string[] = []): Card[] {
  return scriptedDeck(hands.map(parseCards), parseCard(discard), drawOrder.map(parseCard));
}

export const ids = (cards: readonly Card[]): string[] => cards.map(cardId);

/**
 * A sensible-but-dumb discard for random-play tests: keep the most common suit,
 * throw an off-suit card (lowest first), never the card just taken from the
 * discard pile. Without this, random play almost never earns a complete hand
 * and rounds run forever.
 */
export function pickDiscard(hand: readonly Card[], untouchable: Card | null): Card {
  const counts = new Map<string, number>();
  for (const c of hand) counts.set(c.suit, (counts.get(c.suit) ?? 0) + 1);
  const majority = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]![0];
  const legal = hand.filter((c) => !untouchable || cardId(c) !== cardId(untouchable));
  const offSuit = legal.filter((c) => c.suit !== majority);
  const pool = offSuit.length ? offSuit : legal;
  return [...pool].sort((a, b) => cardValue(a.rank) - cardValue(b.rank))[0]!;
}
