/**
 * @thirtyone/rules — the Thirty-One game engine.
 *
 * Everything here is a pure function over plain data. No React, no Expo, no
 * Colyseus, no Node. The same code runs the on-device practice game and the
 * authoritative server, so the two can never disagree about a hand.
 */
export const RULES_VERSION = '0.2.0';

export * from './cards';
export * from './rng';
export * from './scoring';
export * from './game';
export * from './turn';
