import { makeDeck, sameCard, type Card, type Hand } from './cards';
import { nextInt, seedRng, shuffle, type RngState } from './rng';
import { findThirtyOne, scoreHand, type HandScore } from './scoring';

export const MIN_SEATS = 2;
export const MAX_SEATS = 10;
export const HAND_SIZE = 3;
/** Four folded corners, then you are "on the bus". One more loss and you are out. */
export const FOLDS_TO_BUS = 4;

export type SeatId = string;

export interface Seat {
  readonly id: SeatId;
  /** 3 cards normally, 4 between a draw and a discard. Empty before the first deal. */
  readonly hand: readonly Card[];
  /** Corners folded so far, 0–4. 4 means on the bus. */
  readonly folds: number;
  /** Eliminated: lost while on the bus, or forfeited. */
  readonly out: boolean;
}

/**
 * lobby → playing → roundOver (hands revealed, folds not yet applied) →
 * betweenRounds (folds applied, waiting for the next deal) → playing … → gameOver.
 */
export type Phase = 'lobby' | 'playing' | 'roundOver' | 'betweenRounds' | 'gameOver';

export type RoundEndReason = 'knock' | 'thirtyOne';

export interface RevealedHand {
  readonly seat: number;
  readonly hand: Hand;
  readonly score: HandScore;
}

export interface RoundResult {
  readonly reason: RoundEndReason;
  readonly knocker: number | null;
  /** Every seat still in the game, with the three cards that count for them. */
  readonly hands: readonly RevealedHand[];
  /** Seats holding 31 when the round ended by 31. Empty for a knock. */
  readonly thirtyOneSeats: readonly number[];
}

export interface GameState {
  readonly seats: readonly Seat[];
  /** Face down. Last element is the top. */
  readonly drawPile: readonly Card[];
  /** Face up. Last element is the top. */
  readonly discardPile: readonly Card[];
  readonly dealer: number;
  readonly turn: number;
  readonly phase: Phase;
  /** 1-based; 0 before the first deal. */
  readonly round: number;
  /** Seat that knocked this round. Stays set even if that seat forfeits afterwards. */
  readonly knocker: number | null;
  /** After a knock: the seats still owed their one more turn, in order. Reveal when empty. */
  readonly pendingAfterKnock: readonly number[] | null;
  /** The card the current player took from the discard pile this turn, if any. It cannot be thrown straight back. */
  readonly tookFromDiscard: Card | null;
  readonly rng: RngState;
  readonly roundResult: RoundResult | null;
  /** Set when the game is over: the winning seat, or null if it ended with no winner. */
  readonly winner: number | null;
}

export interface CreateGameOptions {
  /** Pick the first dealer instead of choosing one at random. Seat index. */
  readonly dealer?: number;
}

/** A new game in the lobby, nothing dealt. Seats are in table order; play moves to higher indices. */
export function createGame(
  seatIds: readonly SeatId[],
  seed: number,
  options: CreateGameOptions = {},
): GameState {
  if (seatIds.length < MIN_SEATS || seatIds.length > MAX_SEATS) {
    throw new Error(`A game needs ${MIN_SEATS}–${MAX_SEATS} seats, got ${seatIds.length}`);
  }
  if (new Set(seatIds).size !== seatIds.length) throw new Error('Seat ids must be unique');

  let rng = seedRng(seed);
  let dealer: number;
  if (options.dealer !== undefined) {
    if (options.dealer < 0 || options.dealer >= seatIds.length)
      throw new Error('Dealer out of range');
    dealer = options.dealer;
  } else {
    const pick = nextInt(rng, seatIds.length);
    rng = pick.state;
    dealer = pick.value;
  }

  return {
    seats: seatIds.map((id) => ({ id, hand: [], folds: 0, out: false })),
    drawPile: [],
    discardPile: [],
    dealer,
    turn: dealer,
    phase: 'lobby',
    round: 0,
    knocker: null,
    pendingAfterKnock: null,
    tookFromDiscard: null,
    rng,
    roundResult: null,
    winner: null,
  };
}

// ---------------------------------------------------------------------------
// Seat helpers

export function activeSeatIndices(state: GameState): number[] {
  const out: number[] = [];
  state.seats.forEach((s, i) => {
    if (!s.out) out.push(i);
  });
  return out;
}

export function activeSeatCount(state: GameState): number {
  return activeSeatIndices(state).length;
}

/** The next seat still in the game after `from`, moving left (increasing index, wrapping). */
export function nextActiveSeat(state: GameState, from: number): number {
  const n = state.seats.length;
  for (let step = 1; step <= n; step++) {
    const i = (from + step) % n;
    if (!state.seats[i]!.out) return i;
  }
  throw new Error('No active seats');
}

export function seatIndexOf(state: GameState, id: SeatId): number {
  const i = state.seats.findIndex((s) => s.id === id);
  if (i < 0) throw new Error(`No seat "${id}"`);
  return i;
}

/** Every card in the game, in no particular order. Always 52 in a consistent state. */
export function allCards(state: GameState): Card[] {
  return [...state.drawPile, ...state.discardPile, ...state.seats.flatMap((s) => s.hand)];
}

export function asHand(cards: readonly Card[]): Hand {
  if (cards.length !== HAND_SIZE)
    throw new Error(`Expected ${HAND_SIZE} cards, got ${cards.length}`);
  return cards as unknown as Hand;
}

export function handContains(hand: readonly Card[], card: Card): boolean {
  return hand.some((c) => sameCard(c, card));
}

export function removeCard(hand: readonly Card[], card: Card): Card[] {
  const i = hand.findIndex((c) => sameCard(c, card));
  if (i < 0) throw new Error('Card not in hand');
  return [...hand.slice(0, i), ...hand.slice(i + 1)];
}

// ---------------------------------------------------------------------------
// Rounds

export interface StartRoundOptions {
  /**
   * Deal from this exact order instead of shuffling. The last card is the top of
   * the pile, so the first card dealt is `deck[deck.length - 1]`. Must be a full
   * 52-card deck. For tests and the guided first game.
   */
  readonly deck?: readonly Card[];
}

export interface RoundStart {
  readonly state: GameState;
  readonly events: GameEvent[];
}

/**
 * Collect every card, shuffle, deal three to each seat still in, flip the first
 * discard, and hand the turn to the player left of the dealer. A hand dealt 31
 * ends the round on the spot.
 */
export function startRound(state: GameState, options: StartRoundOptions = {}): RoundStart {
  if (state.phase !== 'lobby' && state.phase !== 'betweenRounds') {
    throw new Error(`Cannot start a round in phase "${state.phase}"`);
  }
  const active = activeSeatIndices(state);
  if (active.length < MIN_SEATS) throw new Error('Need at least two players to start a round');

  let rng = state.rng;
  let deck: Card[];
  if (options.deck) {
    if (options.deck.length !== 52) throw new Error('A scripted deck must have 52 cards');
    deck = [...options.deck];
  } else {
    const shuffled = shuffle(makeDeck(), rng);
    deck = shuffled.items;
    rng = shuffled.state;
  }

  // The dealer for round 1 is whoever createGame chose; resolveRound moves it after that.
  const hands = new Map<number, Card[]>();
  for (const i of active) hands.set(i, []);
  for (let n = 0; n < HAND_SIZE; n++) {
    for (const i of active) hands.get(i)!.push(deck.pop()!);
  }
  const firstDiscard = deck.pop()!;

  const seats = state.seats.map((s, i) => ({ ...s, hand: hands.get(i) ?? [] }));
  const round = state.round + 1;
  const firstTurn = nextActiveSeat(state, state.dealer);

  let next: GameState = {
    ...state,
    seats,
    drawPile: deck,
    discardPile: [firstDiscard],
    turn: firstTurn,
    phase: 'playing',
    round,
    knocker: null,
    pendingAfterKnock: null,
    tookFromDiscard: null,
    rng,
    roundResult: null,
  };

  const events: GameEvent[] = [
    { type: 'roundStarted', round, dealer: state.dealer, firstTurn, discardTop: firstDiscard },
  ];

  // Dealt 31: everyone holding one is safe, the round ends immediately.
  const dealt31 = active.filter((i) => findThirtyOne(next.seats[i]!.hand) !== null);
  if (dealt31.length > 0) {
    for (const seat of dealt31) {
      events.push({ type: 'thirtyOne', seat, hand: findThirtyOne(next.seats[seat]!.hand)! });
    }
    const ended = endRound(next, 'thirtyOne', dealt31);
    next = ended.state;
    events.push(ended.event);
  } else {
    events.push({ type: 'turnChanged', seat: firstTurn });
  }

  return { state: next, events };
}

/** Reveal every active hand and move to `roundOver`. Fold resolution happens in 2c. */
export function endRound(
  state: GameState,
  reason: RoundEndReason,
  thirtyOneSeats: readonly number[] = [],
): { state: GameState; event: RoundOverEvent } {
  const hands: RevealedHand[] = activeSeatIndices(state).map((seat) => {
    const raw = state.seats[seat]!.hand;
    // A seat that drew into 31 is holding four cards; the three that make 31 are what count.
    const hand =
      raw.length === HAND_SIZE
        ? asHand(raw)
        : (findThirtyOne(raw) ?? asHand(raw.slice(0, HAND_SIZE)));
    return { seat, hand, score: scoreHand(hand) };
  });
  const roundResult: RoundResult = { reason, knocker: state.knocker, hands, thirtyOneSeats };
  const event: RoundOverEvent = { type: 'roundOver', ...roundResult };
  return { state: { ...state, phase: 'roundOver', roundResult }, event };
}

// ---------------------------------------------------------------------------
// Events — what the UI animates and, later, what the server broadcasts.
// Events carry private cards (a drawn card, a hand at reveal); `viewFor` in 2d
// is what decides who gets to see them.

export type GameEvent =
  | { type: 'roundStarted'; round: number; dealer: number; firstTurn: number; discardTop: Card }
  | { type: 'turnChanged'; seat: number }
  /** `card` is present for the drawer and for discard-pile draws; redacted otherwise. */
  | { type: 'drew'; seat: number; source: DrawSource; card?: Card }
  | { type: 'reshuffled'; cards: number }
  | { type: 'discarded'; seat: number; card: Card }
  | { type: 'knocked'; seat: number }
  | { type: 'thirtyOne'; seat: number; hand: Hand }
  | RoundOverEvent
  | { type: 'folded'; seat: number; corners: number; folds: number; onBus: boolean }
  | { type: 'eliminated'; seat: number }
  | { type: 'roundReplayed' }
  | { type: 'dealerMoved'; seat: number }
  | { type: 'forfeited'; seat: number }
  | { type: 'gameWon'; seat: number }
  | { type: 'gameAbandoned' };

export type RoundOverEvent = { type: 'roundOver' } & RoundResult;

export type DrawSource = 'deck' | 'discard';
