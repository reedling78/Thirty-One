import { sameCard, type Card } from './cards';
import { shuffle } from './rng';
import { findThirtyOne } from './scoring';
import {
  HAND_SIZE,
  endRound,
  handContains,
  nextActiveSeat,
  removeCard,
  type DrawSource,
  type GameEvent,
  type GameState,
} from './game';

export type Action =
  { type: 'draw'; source: DrawSource } | { type: 'discard'; card: Card } | { type: 'knock' };

export type ActionErrorCode =
  | 'notPlaying'
  | 'notYourTurn'
  | 'mustDrawFirst'
  | 'mustDiscardFirst'
  | 'cardNotInHand'
  | 'cannotThrowBackDrawnDiscard'
  | 'knockNotAllowedAfterDraw'
  | 'someoneAlreadyKnocked'
  | 'noCardsToDraw';

export interface ActionError {
  readonly code: ActionErrorCode;
  readonly message: string;
}

export type ApplyResult =
  | { readonly ok: true; readonly state: GameState; readonly events: readonly GameEvent[] }
  | { readonly ok: false; readonly error: ActionError };

function fail(code: ActionErrorCode, message: string): ApplyResult {
  return { ok: false, error: { code, message } };
}

/** Which actions `seat` may take right now. Empty when it is not their move. */
export function legalActions(state: GameState, seat: number): Action['type'][] {
  if (state.phase !== 'playing' || state.turn !== seat) return [];
  const hand = state.seats[seat]!.hand;
  if (hand.length > HAND_SIZE) return ['discard'];
  const actions: Action['type'][] = ['draw'];
  if (state.knocker === null) actions.push('knock');
  return actions;
}

/**
 * The turn reducer. Pure: returns a new state and the events that explain the
 * change, or a typed error. Never throws on a bad move.
 */
export function apply(state: GameState, seat: number, action: Action): ApplyResult {
  if (state.phase !== 'playing')
    return fail('notPlaying', `No round in progress (phase: ${state.phase})`);
  if (state.turn !== seat)
    return fail('notYourTurn', `It is seat ${state.turn}'s turn, not seat ${seat}'s`);

  switch (action.type) {
    case 'draw':
      return draw(state, seat, action.source);
    case 'discard':
      return discard(state, seat, action.card);
    case 'knock':
      return knock(state, seat);
  }
}

function draw(state: GameState, seat: number, source: DrawSource): ApplyResult {
  const player = state.seats[seat]!;
  if (player.hand.length > HAND_SIZE)
    return fail('mustDiscardFirst', 'You are holding four cards; discard one');

  let drawPile = state.drawPile;
  let discardPile = state.discardPile;
  let rng = state.rng;
  const events: GameEvent[] = [];
  let card: Card;
  let tookFromDiscard: Card | null = null;

  if (source === 'discard') {
    const top = discardPile[discardPile.length - 1];
    if (!top) return fail('noCardsToDraw', 'The discard pile is empty');
    card = top;
    tookFromDiscard = top;
    discardPile = discardPile.slice(0, -1);
  } else {
    if (drawPile.length === 0) {
      // Reshuffle the discard pile under its top card.
      const top = discardPile[discardPile.length - 1];
      const rest = discardPile.slice(0, -1);
      if (!top || rest.length === 0) return fail('noCardsToDraw', 'No cards left to draw');
      const shuffled = shuffle(rest, rng);
      rng = shuffled.state;
      drawPile = shuffled.items;
      discardPile = [top];
      events.push({ type: 'reshuffled', cards: drawPile.length });
    }
    card = drawPile[drawPile.length - 1]!;
    drawPile = drawPile.slice(0, -1);
  }

  const hand = [...player.hand, card];
  const seats = state.seats.map((s, i) => (i === seat ? { ...s, hand } : s));
  let next: GameState = { ...state, seats, drawPile, discardPile, rng, tookFromDiscard };
  events.push({ type: 'drew', seat, source, card });

  // 31 counts the moment any three cards in hand make it, four-card hand included.
  const thirtyOne = findThirtyOne(hand);
  if (thirtyOne) {
    events.push({ type: 'thirtyOne', seat, hand: thirtyOne });
    const ended = endRound(next, 'thirtyOne', [seat]);
    next = ended.state;
    events.push(ended.event);
  }

  return { ok: true, state: next, events };
}

function discard(state: GameState, seat: number, card: Card): ApplyResult {
  const player = state.seats[seat]!;
  if (player.hand.length <= HAND_SIZE)
    return fail('mustDrawFirst', 'Draw a card before discarding');
  if (!handContains(player.hand, card))
    return fail('cardNotInHand', 'That card is not in your hand');
  if (state.tookFromDiscard && sameCard(state.tookFromDiscard, card)) {
    return fail(
      'cannotThrowBackDrawnDiscard',
      'You cannot discard the card you just took from the discard pile',
    );
  }

  const seats = state.seats.map((s, i) =>
    i === seat ? { ...s, hand: removeCard(s.hand, card) } : s,
  );
  const events: GameEvent[] = [{ type: 'discarded', seat, card }];
  const next: GameState = {
    ...state,
    seats,
    discardPile: [...state.discardPile, card],
    tookFromDiscard: null,
  };

  return advanceTurn(next, events);
}

function knock(state: GameState, seat: number): ApplyResult {
  const player = state.seats[seat]!;
  if (player.hand.length > HAND_SIZE)
    return fail('knockNotAllowedAfterDraw', 'Knocking replaces your turn; you have already drawn');
  if (state.knocker !== null)
    return fail('someoneAlreadyKnocked', `Seat ${state.knocker} already knocked`);

  // Every other player gets exactly one more turn, in table order from the knocker.
  const pending: number[] = [];
  let i = nextActiveSeat(state, seat);
  while (i !== seat) {
    pending.push(i);
    i = nextActiveSeat(state, i);
  }
  const next: GameState = { ...state, knocker: seat, pendingAfterKnock: pending };
  return advanceTurn(next, [{ type: 'knocked', seat }]);
}

/** A turn is complete: hand it on, or reveal once everyone owed a turn after the knock has had it. */
export function advanceTurn(state: GameState, events: GameEvent[]): ApplyResult {
  let next = state;
  if (next.pendingAfterKnock !== null) {
    // The knock itself is not one of the owed turns; a completed turn by anyone else is.
    const justKnocked = events.some((e) => e.type === 'knocked');
    const pending = justKnocked
      ? next.pendingAfterKnock
      : next.pendingAfterKnock.filter((s) => s !== next.turn);
    next = { ...next, pendingAfterKnock: pending };
    if (pending.length === 0) {
      const ended = endRound(next, 'knock');
      events.push(ended.event);
      return { ok: true, state: ended.state, events };
    }
    const turn = pending[0]!;
    next = { ...next, turn };
    events.push({ type: 'turnChanged', seat: turn });
    return { ok: true, state: next, events };
  }
  const turn = nextActiveSeat(next, next.turn);
  next = { ...next, turn };
  events.push({ type: 'turnChanged', seat: turn });
  return { ok: true, state: next, events };
}
