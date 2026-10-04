/**
 * @thirtyone/bots — computer opponents.
 *
 * A bot receives a PlayerView (its own hand plus public state) and returns an
 * Action. It never sees GameState, so it cannot cheat.
 */
import { RULES_VERSION } from '@thirtyone/rules';

export const BOTS_VERSION = '0.0.0';
export const rulesVersion = RULES_VERSION;
