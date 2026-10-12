import { bestDiscard } from '@thirtyone/bots';
import { cardLabel, parseCard, parseCards, scriptedDeck, type PlayerView } from '@thirtyone/rules';

/**
 * The guided first game: a known deal, and a handful of steps that explain the
 * table as the player reaches each moment. Steps key off the live view, so they
 * still make sense if the player does something other than what the script hopes.
 *
 * The deal: you hold K♥ Q♥ 6♣ (20 in hearts); the deck's top card is the 9♥.
 * Draw it and your hand is complete — K Q 9 of hearts, 29 — and you can knock.
 */
export const GUIDED_SEATS = 4;
export const GUIDED_DEALER = 3; // so the player (seat 0) goes first
export const GUIDED_DECK = scriptedDeck(
  [parseCards('Kh Qh 6c'), parseCards('9d 3c 4s'), parseCards('5s 6s 7c'), parseCards('8d 2c Jd')],
  parseCard('2d'),
  parseCards('9h 10c 7d 8c'),
);

export type GuideStepId = 'draw' | 'discard' | 'knock' | 'waiting' | 'reveal' | 'done';

export interface GuideStep {
  readonly id: GuideStepId;
  readonly title: string;
  readonly body: string;
}

/** Which step applies to this view, if any. The caller hides steps the player has dismissed. */
export function guideStepFor(view: PlayerView): GuideStep | null {
  const mine = view.turn === view.seat;
  const score = view.handScore;
  const valueText = score
    ? score.kind === 'suited'
      ? `${score.total} in ${score.suit}`
      : score.kind === 'thirtyOne'
        ? '31'
        : `${score.total} (${score.kind === 'trips' ? 'three of a kind' : 'a straight'})`
    : '';

  if (view.round === 1 && view.phase === 'playing') {
    if (
      mine &&
      view.hand.length === 3 &&
      view.knocker === null &&
      !view.legalActions.includes('knock')
    ) {
      return {
        id: 'draw',
        title: 'Your hand',
        body:
          `These are your three cards. Only cards in one suit count, so you're worth ${valueText}. ` +
          `Draw one card: tap the deck for a hidden card, or the discard pile to take the ${
            view.discardTop ? cardLabel(view.discardTop) : 'face-up card'
          } everyone can see.`,
      };
    }
    if (mine && view.hand.length === 4) {
      const throwAway = bestDiscard(view.hand, view.tookFromDiscard);
      return {
        id: 'discard',
        title: 'Four cards — throw one',
        body:
          `Your value shows the best three of what you hold: ${valueText}. Now discard one, face up. ` +
          `The ${cardLabel(throwAway)} is the one not helping — tap it.`,
      };
    }
    if (mine && view.legalActions.includes('knock')) {
      return {
        id: 'knock',
        title: 'You can knock',
        body:
          `All three of your cards count, so knocking is allowed. ${valueText} is a strong hand. ` +
          `Knock instead of drawing: everyone else gets one more turn, then all hands are shown and the lowest loses a life. ` +
          `Tap KNOCK in the panel above.`,
      };
    }
    if (!mine && view.knocker === null) {
      return {
        id: 'waiting',
        title: 'Watch the table',
        body:
          'Each opponent now draws and discards. Their row shows what they did — what someone throws, ' +
          'and whether they take from the discard, tells you what suit they are chasing.',
      };
    }
  }

  if (view.round === 1 && view.phase === 'roundOver') {
    return {
      id: 'reveal',
      title: 'The reveal',
      body:
        'Every hand is shown. The lowest loses a life and folds a corner of their chip — the circle on the right. ' +
        'Four corners and you are on the bus: one more loss and you are out. Last player standing wins the pot. ' +
        'Tap Continue for the next round.',
    };
  }

  if (view.round === 2 && view.phase === 'playing' && mine) {
    return {
      id: 'done',
      title: 'That’s the game',
      body: 'You know everything you need. Keep going — the table will tell you what to do each turn.',
    };
  }

  return null;
}
