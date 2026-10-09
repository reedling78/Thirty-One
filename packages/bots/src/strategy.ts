import {
  bestScore,
  cardId,
  nextRandom,
  scoreHand,
  type Action,
  type Card,
  type Hand,
  type PlayerView,
  type RngState,
} from '@thirtyone/rules';

/**
 * A bot sees a PlayerView — its own cards and the public table — and returns an
 * Action. It never sees GameState, so it cannot cheat. Randomness is threaded
 * through so a seeded game with bots is reproducible.
 */
export interface Bot {
  readonly name: string;
  decide(view: PlayerView, rng: RngState): Decision;
}

export interface Decision {
  readonly action: Action;
  readonly rng: RngState;
}

/**
 * Knobs for the threshold bot. The knock threshold is
 *   knockBase − perPlayer × (players still in − 2) − perTurn × turns this round
 * The lowest hand loses, so with more players at the table it is *less* likely
 * that yours is the lowest, and the threshold falls. It also falls as the round
 * goes on: everyone has had their chances to improve, waiting buys less, and a
 * falling threshold guarantees every round ends.
 */
export interface Personality {
  readonly name: string;
  readonly knockBase: number;
  readonly perPlayer: number;
  readonly perTurn: number;
  readonly maxThreshold: number;
  /**
   * 0–1: chance per decision of a random draw source or discard instead of the
   * best one. Noise never knocks — a random knock on a bad hand is the one
   * mistake that costs two corners, and the easy bot should be beatable, not suicidal.
   */
  readonly noise: number;
}

export const NORMAL: Personality = {
  name: 'normal',
  knockBase: 27,
  perPlayer: 0.5,
  perTurn: 1,
  maxThreshold: 30,
  noise: 0,
};

export const EASY: Personality = {
  ...NORMAL,
  name: 'easy',
  knockBase: 22,
  perTurn: 0,
  noise: 0.2,
};

export function knockThreshold(p: Personality, playersIn: number, turnsThisRound: number): number {
  // perTurn is per lap of the table, so a 10-seat round does not collapse in ten turns.
  const laps = turnsThisRound / playersIn;
  const t = p.knockBase - p.perPlayer * (playersIn - 2) - p.perTurn * laps;
  return Math.min(p.maxThreshold, Math.max(0, t));
}

/** The discard that leaves the best three-card hand. Never the card just taken from the discard pile. */
export function bestDiscard(hand: readonly Card[], untouchable: Card | null): Card {
  let best: { card: Card; total: number } | null = null;
  for (const candidate of hand) {
    if (untouchable && cardId(candidate) === cardId(untouchable)) continue;
    const rest = hand.filter((c) => cardId(c) !== cardId(candidate));
    const total =
      rest.length === 3 ? scoreHand(rest as unknown as Hand).total : (bestScore(rest)?.total ?? 0);
    if (!best || total > best.total) best = { card: candidate, total };
  }
  if (!best) throw new Error('No legal discard');
  return best.card;
}

/** Would taking the discard top strictly improve the hand after the best discard? */
export function discardImproves(hand: readonly Card[], discardTop: Card): boolean {
  const now = bestScore(hand)?.total ?? 0;
  const withTop = [...hand, discardTop];
  // After taking it we must throw something else back, so score the best three that keep it.
  let best = 0;
  for (const thrown of hand) {
    const rest = withTop.filter((c) => cardId(c) !== cardId(thrown));
    best = Math.max(best, bestScore(rest)?.total ?? 0);
  }
  return best > now;
}

export function makeBot(p: Personality): Bot {
  return {
    name: p.name,
    decide(view, rng) {
      let r = rng;
      const legal = view.legalActions;
      if (legal.length === 0) throw new Error(`Seat ${view.seat} has no legal action`);

      if (p.noise > 0) {
        const roll = nextRandom(r);
        r = roll.state;
        if (roll.value < p.noise) return { action: randomAction(view, r), rng: r };
      }

      if (legal.includes('discard')) {
        return {
          action: { type: 'discard', card: bestDiscard(view.hand, view.tookFromDiscard) },
          rng: r,
        };
      }

      const score = view.handScore?.total ?? 0;
      const playersIn = view.seats.filter((s) => !s.out).length;
      if (legal.includes('knock') && score >= knockThreshold(p, playersIn, view.turnsThisRound)) {
        return { action: { type: 'knock' }, rng: r };
      }

      const source =
        view.discardTop && discardImproves(view.hand, view.discardTop) ? 'discard' : 'deck';
      return { action: { type: 'draw', source }, rng: r };
    },
  };
}

function randomAction(view: PlayerView, rng: RngState): Action {
  const legal = view.legalActions;
  const pick = nextRandom(rng).value;
  if (legal.includes('discard')) {
    const options = view.hand.filter(
      (c) => !view.tookFromDiscard || cardId(c) !== cardId(view.tookFromDiscard),
    );
    return { type: 'discard', card: options[Math.floor(pick * options.length)]! };
  }
  const choices: Action[] = [{ type: 'draw', source: 'deck' }];
  if (view.discardTop) choices.push({ type: 'draw', source: 'discard' });
  return choices[Math.floor(pick * choices.length)]!;
}

export const normalBot: Bot = makeBot(NORMAL);
export const easyBot: Bot = makeBot(EASY);
