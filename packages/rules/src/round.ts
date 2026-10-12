import {
  FOLDS_TO_BUS,
  activeSeatIndices,
  nextActiveSeat,
  type GameEvent,
  type GameState,
  type Seat,
} from './game';
import { advanceTurn } from './turn';

export interface Transition {
  readonly state: GameState;
  readonly events: readonly GameEvent[];
}

/**
 * Apply the revealed round: the lowest hand folds a corner (ties all fold, a
 * losing knocker folds two, a 31 makes everyone else fold), bus riders who lose
 * go out, the dealer moves left, and the game ends when one player remains.
 *
 * Requires phase `roundOver`. Leaves the game in `betweenRounds` (call
 * `startRound` next) or `gameOver`.
 */
export function resolveRound(state: GameState): Transition {
  if (state.phase !== 'roundOver' || !state.roundResult) {
    throw new Error(`Cannot resolve a round in phase "${state.phase}"`);
  }
  const result = state.roundResult;
  const events: GameEvent[] = [];

  const penalties = new Map(result.penalties.map((p) => [p.seat, p.corners]));

  // Every remaining player would go out at once: replay the round, nobody folds.
  const active = activeSeatIndices(state);
  const wouldBeOut = active.filter((i) => {
    const corners = penalties.get(i) ?? 0;
    return corners > 0 && state.seats[i]!.folds + corners > FOLDS_TO_BUS;
  });
  if (wouldBeOut.length === active.length) {
    events.push({ type: 'roundReplayed' });
    return { state: { ...state, phase: 'betweenRounds', roundResult: null }, events };
  }

  const seats: Seat[] = state.seats.map((s, i) => {
    const corners = penalties.get(i);
    if (!corners) return s;
    const folds = s.folds + corners;
    const out = folds > FOLDS_TO_BUS;
    events.push({
      type: 'folded',
      seat: i,
      corners,
      folds: Math.min(folds, FOLDS_TO_BUS),
      onBus: folds >= FOLDS_TO_BUS,
    });
    if (out) events.push({ type: 'eliminated', seat: i });
    return { ...s, folds: Math.min(folds, FOLDS_TO_BUS), out };
  });

  let next: GameState = { ...state, seats, roundResult: null };
  const remaining = activeSeatIndices(next);
  if (remaining.length === 1) {
    const winner = remaining[0]!;
    events.push({ type: 'gameWon', seat: winner });
    return { state: { ...next, phase: 'gameOver', winner }, events };
  }

  const dealer = nextActiveSeat(next, next.dealer);
  next = { ...next, dealer, phase: 'betweenRounds' };
  events.push({ type: 'dealerMoved', seat: dealer });
  return { state: next, events };
}

/**
 * A player times out or quits. They are out for good: their corners count for
 * nothing and their chip stays in the pot. Their cards go to the bottom of the
 * draw pile and the round carries on without them — a knock in progress stands.
 * If that leaves one player, the game ends with no winner.
 */
export function forfeit(state: GameState, seat: number): Transition {
  if (state.phase === 'gameOver') throw new Error('The game is over');
  const player = state.seats[seat];
  if (!player) throw new Error(`No seat ${seat}`);
  if (player.out) throw new Error(`Seat ${seat} is already out`);

  const events: GameEvent[] = [{ type: 'forfeited', seat }];
  const seats = state.seats.map((s, i) => (i === seat ? { ...s, hand: [], out: true } : s));
  const next: GameState = {
    ...state,
    seats,
    drawPile: [...player.hand, ...state.drawPile],
    pendingAfterKnock: state.pendingAfterKnock?.filter((s) => s !== seat) ?? null,
  };

  const remaining = activeSeatIndices(next);
  if (remaining.length < 2) {
    events.push({ type: 'gameAbandoned' });
    return { state: { ...next, phase: 'gameOver', winner: null, roundResult: null }, events };
  }

  if (next.phase !== 'playing') return { state: next, events };

  if (next.turn === seat) {
    // Their turn is simply skipped. advanceTurn handles the reveal if they were the
    // last one owed a turn after a knock.
    const r = advanceTurn(next, events);
    if (!r.ok) throw new Error('unreachable');
    return { state: r.state, events: r.events };
  }

  // Not their turn. After a knock the seat on turn is always first in the pending
  // list, so dropping a later seat can never empty it; nothing more to do.
  return { state: next, events };
}
