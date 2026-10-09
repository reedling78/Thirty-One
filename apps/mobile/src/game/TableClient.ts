import type { Action, ActionError, GameEvent, PlayerView } from '@thirtyone/rules';

/** What the table screen receives on every change: the player's view and the events since the last one. */
export interface TableSnapshot {
  readonly view: PlayerView;
  /** Already redacted for this seat. Empty on the initial snapshot. */
  readonly events: readonly GameEvent[];
}

/**
 * The table screen's only way to talk to a game. In practice mode a
 * LocalTableClient runs the engine and bots on the device; in slice 2 a
 * ColyseusTableClient implements the same interface against the server.
 * The screen is the same code either way.
 */
export interface TableClient {
  /** The seat this client plays. */
  readonly seat: number;
  /** Subscribe to snapshots. The listener is called immediately with the current one. */
  subscribe(listener: (snapshot: TableSnapshot) => void): () => void;
  /** Take an action for this seat. Returns the error if it was illegal. */
  send(action: Action): ActionError | null;
  /** Begin the game: deal the first round and start the bots. */
  start(): void;
  /** Stop timers. The client is unusable afterwards. */
  dispose(): void;
}
