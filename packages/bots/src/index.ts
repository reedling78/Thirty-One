/**
 * @thirtyone/bots — computer opponents.
 *
 * A bot receives a PlayerView (its own hand plus public state) and returns an
 * Action. It never sees GameState, so it cannot cheat.
 */
export const BOTS_VERSION = '0.1.0';

export * from './strategy';
export * from './simulate';
