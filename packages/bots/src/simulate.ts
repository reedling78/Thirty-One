import {
  apply,
  createGame,
  resolveRound,
  seedRng,
  startRound,
  viewFor,
  type GameEvent,
  type GameState,
} from '@thirtyone/rules';
import type { Bot } from './strategy';

export interface SimulationOptions {
  readonly games: number;
  readonly seats: number;
  readonly bots: readonly Bot[];
  readonly seed: number;
}

export interface SimulationStats {
  readonly games: number;
  readonly seats: number;
  readonly roundsPerGame: number;
  readonly turnsPerRound: number;
  readonly knocksPerRound: number;
  /** Share of knocked rounds where the knocker was not lowest. */
  readonly knockSuccessRate: number;
  readonly thirtyOnesPerRound: number;
  readonly reshufflesPerRound: number;
  readonly replaysPerGame: number;
  /** Wins by seat index, as a share of games. */
  readonly winShare: readonly number[];
  /** Wins by bot name, as a share of games. */
  readonly winShareByBot: Readonly<Record<string, number>>;
}

/** Play one whole game with the given bots (bot i sits in seat i mod bots.length). */
export function playGame(
  seats: number,
  bots: readonly Bot[],
  seed: number,
): { state: GameState; events: GameEvent[] } {
  const ids = Array.from({ length: seats }, (_, i) => `seat${i}`);
  let g = createGame(ids, seed);
  let rng = seedRng(seed ^ 0x5bd1e995);
  const events: GameEvent[] = [];
  const start = startRound(g);
  g = start.state;
  events.push(...start.events);
  let guard = 0;
  while (g.phase !== 'gameOver') {
    if (++guard > 100_000) throw new Error('Game did not terminate');
    if (g.phase === 'roundOver') {
      const r = resolveRound(g);
      g = r.state;
      events.push(...r.events);
      continue;
    }
    if (g.phase === 'betweenRounds') {
      const r = startRound(g);
      g = r.state;
      events.push(...r.events);
      continue;
    }
    const seat = g.turn;
    const bot = bots[seat % bots.length]!;
    const d = bot.decide(viewFor(g, seat), rng);
    rng = d.rng;
    const r = apply(g, seat, d.action);
    if (!r.ok)
      throw new Error(`${bot.name} at seat ${seat} chose an illegal action: ${r.error.code}`);
    g = r.state;
    events.push(...r.events);
  }
  return { state: g, events };
}

export function simulate(options: SimulationOptions): SimulationStats {
  const { games, seats, bots, seed } = options;
  let rounds = 0;
  let turns = 0;
  let knocks = 0;
  let knockWins = 0;
  let thirtyOnes = 0;
  let reshuffles = 0;
  let replays = 0;
  const wins = new Array<number>(seats).fill(0);
  const winsByBot: Record<string, number> = {};
  for (const b of bots) winsByBot[b.name] = 0;

  for (let i = 0; i < games; i++) {
    const { state, events } = playGame(seats, bots, seed + i);
    let roundTurns = 0;
    let knocker: number | null = null;
    for (const e of events) {
      switch (e.type) {
        case 'roundStarted':
          rounds++;
          roundTurns = 0;
          knocker = null;
          break;
        case 'discarded':
          roundTurns++;
          break;
        case 'knocked':
          knocks++;
          knocker = e.seat;
          break;
        case 'thirtyOne':
          thirtyOnes++;
          break;
        case 'reshuffled':
          reshuffles++;
          break;
        case 'roundReplayed':
          replays++;
          break;
        case 'roundOver': {
          turns += roundTurns;
          if (knocker !== null && e.reason === 'knock') {
            const lowest = Math.min(...e.hands.map((h) => h.score.total));
            const knockerHand = e.hands.find((h) => h.seat === knocker);
            if (knockerHand && knockerHand.score.total > lowest) knockWins++;
          }
          break;
        }
      }
    }
    if (state.winner !== null) {
      wins[state.winner]!++;
      const name = bots[state.winner % bots.length]!.name;
      winsByBot[name] = (winsByBot[name] ?? 0) + 1;
    }
  }

  const byBot: Record<string, number> = {};
  for (const [name, n] of Object.entries(winsByBot)) byBot[name] = n / games;
  return {
    games,
    seats,
    roundsPerGame: rounds / games,
    turnsPerRound: turns / rounds,
    knocksPerRound: knocks / rounds,
    knockSuccessRate: knocks ? knockWins / knocks : 0,
    thirtyOnesPerRound: thirtyOnes / rounds,
    reshufflesPerRound: reshuffles / rounds,
    replaysPerGame: replays / games,
    winShare: wins.map((w) => w / games),
    winShareByBot: byBot,
  };
}
