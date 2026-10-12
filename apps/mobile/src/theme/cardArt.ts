/**
 * ThirtyOne card artwork data — the same numbers the Design canvas renders with.
 * Render with react-native-svg. All paths are original.
 *
 * Three sizes:
 *   small  34×48  — opponent rows, rules examples (index + one centre pip)
 *   normal 64×92  — your hand                    (full pip layout / court figure)
 *   large  88×126 — the piles                    (full pip layout / court figure)
 */

import { color } from './tokens';

export type Suit = 'h' | 'd' | 'c' | 's';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
export type CardSize = 'small' | 'normal' | 'large';

/** Suit pips, each in a 24×24 viewBox. */
export const SUIT = {
  h: { name: 'hearts',   color: color.suitRed,   path: 'M12 21s-7-4.5-9.5-9C.8 8.6 2.5 4 6.5 4c2.2 0 3.9 1.3 5.5 3.2C13.6 5.3 15.3 4 17.5 4c4 0 5.7 4.6 4 8-2.5 4.5-9.5 9-9.5 9z' },
  d: { name: 'diamonds', color: color.suitRed,   path: 'M12 2l7 10-7 10-7-10z' },
  c: { name: 'clubs',    color: color.suitBlack, path: 'M12 2a3.6 3.6 0 0 0-3.3 5A3.7 3.7 0 1 0 11 13.3c-.2 2.4-.9 4.3-2.5 5.7h7c-1.6-1.4-2.3-3.3-2.5-5.7A3.7 3.7 0 1 0 15.3 7 3.6 3.6 0 0 0 12 2z' },
  s: { name: 'spades',   color: color.suitBlack, path: 'M12 2C9 7 4 9.5 4 14a4 4 0 0 0 7 2.6c-.2 2-.9 3.4-2.5 4.4h7c-1.6-1-2.3-2.4-2.5-4.4A4 4 0 0 0 20 14c0-4.5-5-7-8-12z' },
} as const;

export const RANK_NAME: Record<Rank, string> = {
  A: 'Ace', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '10': '10',
  J: 'Jack', Q: 'Queen', K: 'King',
};

/** Per-size geometry. All values in dp at 1×; cards do not text-scale. */
export const SIZE = {
  small: {
    w: 34, h: 48, radius: 5, border: 'rgba(23,21,15,0.3)',
    index: { font: 11, inset: 3 },      // rank only, top-left and mirrored bottom-right
    centrePip: { size: 20, x: 6, y: 13 }, // one pip for every rank
  },
  normal: {
    w: 64, h: 92, radius: 6, border: '#2A271F',
    index: { font: 13, pip: 9, inset: 5 },
    pip: 11, cols: { L: 22, C: 32, R: 42 }, y0: 20, y1: 72,
    ace: { size: 30, x: 17, y: 31 },
    court: { x: 17, y: 17, w: 30, h: 58, stroke: 1.2, cornerPip: 7 },
  },
  large: {
    w: 88, h: 126, radius: 8, border: '#2A271F',
    index: { font: 17, pip: 12, inset: 7 },
    pip: 15, cols: { L: 31, C: 44, R: 57 }, y0: 26, y1: 100,
    ace: { size: 44, x: 22, y: 41 },
    court: { x: 24, y: 24, w: 40, h: 78, stroke: 1, cornerPip: 9 },
  },
} as const;

/**
 * Traditional pip layouts for 2–10: [column, fraction of the pip area from top, flipped?].
 * Pips in the lower half are rotated 180°.
 */
type Col = 'L' | 'C' | 'R';
export const PIP_LAYOUT: Partial<Record<Rank, ReadonlyArray<readonly [Col, number, boolean?]>>> = {
  '2': [['C', 0], ['C', 1, true]],
  '3': [['C', 0], ['C', 0.5], ['C', 1, true]],
  '4': [['L', 0], ['R', 0], ['L', 1, true], ['R', 1, true]],
  '5': [['L', 0], ['R', 0], ['C', 0.5], ['L', 1, true], ['R', 1, true]],
  '6': [['L', 0], ['R', 0], ['L', 0.5], ['R', 0.5], ['L', 1, true], ['R', 1, true]],
  '7': [['L', 0], ['R', 0], ['C', 0.25], ['L', 0.5], ['R', 0.5], ['L', 1, true], ['R', 1, true]],
  '8': [['L', 0], ['R', 0], ['C', 0.25], ['L', 0.5], ['R', 0.5], ['C', 0.75, true], ['L', 1, true], ['R', 1, true]],
  '9': [['L', 0], ['R', 0], ['L', 1 / 3], ['R', 1 / 3], ['C', 0.5], ['L', 2 / 3, true], ['R', 2 / 3, true], ['L', 1, true], ['R', 1, true]],
  '10': [['L', 0], ['R', 0], ['C', 1 / 6], ['L', 1 / 3], ['R', 1 / 3], ['L', 2 / 3, true], ['R', 2 / 3, true], ['C', 5 / 6, true], ['L', 1, true], ['R', 1, true]],
};

/** Resolve a rank's pips to absolute positions (top-left of each pip) for a size. */
export function pipPositions(rank: Rank, size: 'normal' | 'large') {
  const s = SIZE[size];
  return (PIP_LAYOUT[rank] ?? []).map(([col, f, flip]) => ({
    x: s.cols[col] - s.pip / 2,
    y: s.y0 + f * (s.y1 - s.y0) - s.pip / 2,
    rotate: flip ? 180 : 0,
  }));
}

/**
 * Court figures: a bust drawn in a 40×40 box, rendered twice inside a 40×80 frame —
 * once as-is, once rotated 180° about (20,40) — with a hairline across y=40.
 * Each element: { d, fill, stroke }. Stroke width 1 (large) / 1.2 (normal), round joins.
 */
export function courtFigure(rank: 'J' | 'Q' | 'K', suitColor: string) {
  const INK = color.ink, GOLD = color.gold, CREAM = color.cardFace;
  const robe   = { d: 'M6 40 L10 28 Q20 23 30 28 L34 40 Z', fill: suitColor, stroke: INK };
  const collar = { d: 'M14 29 Q20 33 26 29 L24.5 32.5 Q20 35.5 15.5 32.5 Z', fill: CREAM, stroke: INK };
  const head   = { d: 'M13.5 19 a6.5 6.5 0 1 0 13 0 a6.5 6.5 0 1 0 -13 0 Z', fill: CREAM, stroke: INK };
  if (rank === 'K') return [robe, collar, head,
    { d: 'M14 21 Q20 31 26 21 Q20 25.5 14 21 Z', fill: INK, stroke: INK },                 // beard
    { d: 'M12 13 L13 5 L17 10 L20 3 L23 10 L27 5 L28 13 Z', fill: GOLD, stroke: INK }];    // crown
  if (rank === 'Q') return [robe, collar, head,
    { d: 'M13 19 Q12.5 9 20 9 Q27.5 9 27 19 Q25 13 20 13 Q15 13 13 19 Z', fill: INK, stroke: INK }, // hair
    { d: 'M14 11 L17 6 L20 8.5 L23 6 L26 11 Z', fill: GOLD, stroke: INK },                 // tiara
    { d: 'M19 7.5 a1.2 1.2 0 1 0 2.4 0 a1.2 1.2 0 1 0 -2.4 0 Z', fill: suitColor, stroke: suitColor }]; // jewel
  return [robe, collar, head,
    { d: 'M12 14 Q20 5 28 14 Z', fill: suitColor, stroke: INK },                            // cap
    { d: 'M26 11 Q31 2 36 5 Q31 7 28 13 Z', fill: GOLD, stroke: INK }];                     // feather
}

/**
 * Card back: white stock with a solid-colour panel carrying a cream diamond lattice.
 * In RN, render the lattice as a tiling PNG (export at 2×/3×) or two rotated line patterns in SVG.
 */
export const BACK = {
  padding: { small: 3, normal: 5, large: 6 },
  innerRadius: { small: 1, normal: 2, large: 3 },
  latticePeriod: { small: 4, normal: 6, large: 7 }, // dp between lines, 1dp line, at ±45°
  lattice: color.backLattice,
} as const;

/** Accessible name for any card. */
export function cardLabel(rank: Rank, suit: Suit) {
  return `${RANK_NAME[rank]} of ${SUIT[suit].name}`;
}
