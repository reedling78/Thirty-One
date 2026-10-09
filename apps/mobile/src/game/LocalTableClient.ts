import type { Bot } from '@thirtyone/bots';
import {
  apply,
  createGame,
  redactEvents,
  resolveRound,
  seedRng,
  startRound,
  viewFor,
  type Action,
  type ActionError,
  type GameEvent,
  type GameState,
  type RngState,
} from '@thirtyone/rules';
import type { TableClient, TableSnapshot } from './TableClient';

export interface LocalTableOptions {
  /** Total seats including the human. 2–10. */
  readonly seats: number;
  /** Bots fill every seat but the human's; bot i−1 sits in seat i, cycling if there are fewer bots than seats. */
  readonly bots: readonly Bot[];
  readonly seed?: number;
  /** Milliseconds a bot "thinks" before acting. */
  readonly botDelayMs?: number;
  /** Milliseconds the reveal stays on screen before folds are applied. */
  readonly revealDelayMs?: number;
  /** Milliseconds between folds being applied and the next deal. */
  readonly dealDelayMs?: number;
}

const HUMAN_SEAT = 0;

/**
 * Practice mode: the whole game runs on the device. Pure engine calls, with
 * timers only to pace the bots and the reveal so the table reads like a table.
 */
export class LocalTableClient implements TableClient {
  readonly seat = HUMAN_SEAT;

  private state: GameState;
  private rng: RngState;
  private readonly listeners = new Set<(s: TableSnapshot) => void>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;
  private readonly opts: Required<LocalTableOptions>;

  constructor(options: LocalTableOptions) {
    const seed = options.seed ?? Math.floor(Math.random() * 0xffffffff);
    this.opts = {
      seats: options.seats,
      bots: options.bots,
      seed,
      botDelayMs: options.botDelayMs ?? 700,
      revealDelayMs: options.revealDelayMs ?? 2500,
      dealDelayMs: options.dealDelayMs ?? 900,
    };
    const ids = Array.from({ length: options.seats }, (_, i) =>
      i === HUMAN_SEAT ? 'you' : `bot${i}`,
    );
    this.state = createGame(ids, seed);
    this.rng = seedRng(seed ^ 0x5bd1e995);
  }

  subscribe(listener: (snapshot: TableSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener({ view: viewFor(this.state, this.seat), events: [] });
    return () => {
      this.listeners.delete(listener);
    };
  }

  start(): void {
    if (this.state.phase !== 'lobby') return;
    const r = startRound(this.state);
    this.commit(r.state, r.events);
  }

  send(action: Action): ActionError | null {
    if (this.disposed) return { code: 'notPlaying', message: 'This table is closed' };
    const r = apply(this.state, this.seat, action);
    if (!r.ok) return r.error;
    this.commit(r.state, r.events);
    return null;
  }

  dispose(): void {
    this.disposed = true;
    this.clearTimer();
    this.listeners.clear();
  }

  /** Apply a new state, tell the screen, and decide what happens next. */
  private commit(state: GameState, events: readonly GameEvent[]): void {
    this.state = state;
    const snapshot: TableSnapshot = {
      view: viewFor(state, this.seat),
      events: redactEvents(events, this.seat),
    };
    for (const l of this.listeners) l(snapshot);
    this.schedule();
  }

  private schedule(): void {
    this.clearTimer();
    if (this.disposed) return;
    const s = this.state;
    switch (s.phase) {
      case 'playing':
        if (s.turn !== this.seat)
          this.timer = setTimeout(() => this.botTurn(), this.opts.botDelayMs);
        break;
      case 'roundOver':
        this.timer = setTimeout(() => {
          const r = resolveRound(this.state);
          this.commit(r.state, r.events);
        }, this.opts.revealDelayMs);
        break;
      case 'betweenRounds':
        this.timer = setTimeout(() => {
          const r = startRound(this.state);
          this.commit(r.state, r.events);
        }, this.opts.dealDelayMs);
        break;
      default:
        break;
    }
  }

  private botTurn(): void {
    const s = this.state;
    if (s.phase !== 'playing' || s.turn === this.seat) return;
    const bot = this.opts.bots[(s.turn - 1) % this.opts.bots.length]!;
    const d = bot.decide(viewFor(s, s.turn), this.rng);
    this.rng = d.rng;
    const r = apply(s, s.turn, d.action);
    if (!r.ok)
      throw new Error(`Bot ${bot.name} in seat ${s.turn} made an illegal move: ${r.error.code}`);
    this.commit(r.state, r.events);
  }

  private clearTimer(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }
}
