import { cardId, makeDeck, parseCard, parseCards, type Card } from '../src/index';

/**
 * Build a 52-card deck that deals exactly these hands, flips `discard`, and then
 * serves `drawOrder` from the top of the draw pile. Everything unspecified fills
 * the bottom in deck order. `hands[i]` goes to the i-th *active* seat.
 */
export function scriptDeck(hands: string[], discard: string, drawOrder: string[] = []): Card[] {
  const parsedHands = hands.map(parseCards);
  const handSize = parsedHands[0]!.length;
  const dealt: Card[] = [];
  for (let n = 0; n < handSize; n++) for (const h of parsedHands) dealt.push(h[n]!);
  const top = [...dealt, parseCard(discard), ...drawOrder.map(parseCard)];
  const used = new Set(top.map(cardId));
  if (used.size !== top.length) throw new Error('scriptDeck: duplicate card');
  const rest = makeDeck().filter((c) => !used.has(cardId(c)));
  // Last element is dealt first, so reverse the "top" list onto the end.
  return [...rest, ...top.reverse()];
}

export const ids = (cards: readonly Card[]): string[] => cards.map(cardId);
