import type { Card, Hand } from './cards';
import type { GameEvent, GameState, Phase, RoundResult, SeatId } from './game';
import { bestScore, type HandScore } from './scoring';
import { legalActions, type Action } from './turn';

/** What one player can see about another seat. */
export interface SeatView {
  readonly index: number;
  readonly id: SeatId;
  readonly cardCount: number;
  readonly folds: number;
  readonly onBus: boolean;
  readonly out: boolean;
  readonly isTurn: boolean;
  readonly isKnocker: boolean;
  readonly isDealer: boolean;
  /** Their cards and score, only once the round has been revealed. */
  readonly revealed: { readonly hand: Hand; readonly score: HandScore } | null;
}

/**
 * Everything one seat is allowed to know. This is the only shape the UI and the
 * bots ever receive, and in slice 2 it is what the server sends each client —
 * so a hidden card that is not in here cannot leak.
 */
export interface PlayerView {
  readonly seat: number;
  readonly phase: Phase;
  readonly round: number;
  readonly dealer: number;
  readonly turn: number;
  readonly knocker: number | null;
  /** Seats still owed a turn after a knock, in order. */
  readonly pendingAfterKnock: readonly number[] | null;
  readonly hand: readonly Card[];
  /** What the hand is worth now: best three of whatever is held. Null before the deal. */
  readonly handScore: HandScore | null;
  /** The card taken from the discard this turn, which cannot be thrown straight back. */
  readonly tookFromDiscard: Card | null;
  readonly discardTop: Card | null;
  readonly drawPileCount: number;
  readonly discardPileCount: number;
  readonly seats: readonly SeatView[];
  readonly legalActions: readonly Action['type'][];
  /** The reveal, once the round is over. Public to everyone. */
  readonly roundResult: RoundResult | null;
  readonly winner: number | null;
}

export function viewFor(state: GameState, seat: number): PlayerView {
  const me = state.seats[seat];
  if (!me) throw new Error(`No seat ${seat}`);
  const revealed = new Map(state.roundResult?.hands.map((h) => [h.seat, h]) ?? []);

  return {
    seat,
    phase: state.phase,
    round: state.round,
    dealer: state.dealer,
    turn: state.turn,
    knocker: state.knocker,
    pendingAfterKnock: state.pendingAfterKnock,
    hand: me.hand,
    handScore: me.hand.length >= 3 ? bestScore(me.hand) : null,
    tookFromDiscard: state.turn === seat ? state.tookFromDiscard : null,
    discardTop: state.discardPile[state.discardPile.length - 1] ?? null,
    drawPileCount: state.drawPile.length,
    discardPileCount: state.discardPile.length,
    seats: state.seats.map((s, i) => {
      const r = revealed.get(i);
      return {
        index: i,
        id: s.id,
        cardCount: s.hand.length,
        folds: s.folds,
        onBus: s.folds >= 4,
        out: s.out,
        isTurn: state.phase === 'playing' && state.turn === i,
        isKnocker: state.knocker === i,
        isDealer: state.dealer === i,
        revealed: r ? { hand: r.hand, score: r.score } : null,
      };
    }),
    legalActions: legalActions(state, seat),
    roundResult: state.roundResult,
    winner: state.winner,
  };
}

/**
 * The version of an event that `viewer` is allowed to see. Only one event
 * carries a card that is private: a draw from the face-down pile by someone
 * else. Everything else — discards, draws from the face-up pile, the reveal —
 * is public at the table.
 */
export function redactEvent(event: GameEvent, viewer: number): GameEvent {
  if (event.type === 'drew' && event.source === 'deck' && event.seat !== viewer) {
    return { type: 'drew', seat: event.seat, source: 'deck' };
  }
  return event;
}

export function redactEvents(events: readonly GameEvent[], viewer: number): GameEvent[] {
  return events.map((e) => redactEvent(e, viewer));
}
