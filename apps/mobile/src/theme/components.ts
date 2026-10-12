/**
 * Component geometry measured from the Design canvas (2026-10-11) that
 * tokens.ts does not carry: sizes, insets and the few translucent mixes the
 * canvas draws with. Colours are token colours, plain white/black (felt nap,
 * dealer disc, shadows) or the guide scrim, exactly as the canvas has them.
 * Text sizes here are for fixed-size objects only (chips, the dealer disc) —
 * scaled text uses `tokens.type`.
 */
import { color } from './tokens';

/** `hex` at `alpha`, for the canvas's translucent mixes of token colours. */
export function alpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

const WHITE = '#FFFFFF';
const BLACK = '#000000';

/** The felt nap: a soft pool of light, a fine light speckle and a coarser dark one. */
export const FELT = {
  pool: { color: alpha(WHITE, 0.07), cx: 0.5, cy: 0.32, rx: 0.7, ry: 0.45 },
  fine: { color: alpha(WHITE, 0.05), period: 3, r: 0.7 },
  coarse: { color: alpha(BLACK, 0.16), period: 5, r: 0.7, dx: 1, dy: 2 },
} as const;

/** Rows, panel, island: shared shell. */
export const PANEL = {
  gutter: 12, // screen side margin for every panel
  rowRadius: 10,
  rowPad: { top: 8, right: 10, bottom: 8, left: 12 },
  rowGap: 10, // between name block, cards and figure
  rowListGap: 6,
  figureWidth: 40,
  smallCardGap: 4,
  panelPad: { top: 10, right: 12, bottom: 12, left: 12 },
  handGap: 10,
} as const;

export const ISLAND = {
  marginTop: 6,
  padLeft: 14,
  padRight: 12,
  button: { height: 44, padH: 18, radius: 10, border: 1.5 },
} as const;

export const PILES = { gap: 28, padTop: 14, padBottom: 10 } as const;

export const DEALER = {
  size: 20,
  face: WHITE,
  border: color.back.black,
  font: 11,
  shadow: {
    shadowColor: BLACK,
    shadowOpacity: 0.2,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
} as const;

export const PILL = { height: 18, padH: 7 } as const;

/** The ▶ before "Playing now". */
export const PLAYING_MARK = { size: 10, gap: 5, path: 'M2 1.5v9l8-4.5z', viewBox: 12 } as const;

/** Poker chip, drawn in a 40×40 viewBox. */
export const CHIP = {
  viewBox: 40,
  edge: { r: 19, width: 1 },
  notches: { r: 16.5, width: 3, dash: [8.64, 4.32] },
  inner: { r: 11.5, width: 1, dash: [2.5, 2.5] },
  size: { row: 32, panel: 36 },
  /** Number of corners left / the words BUS and OUT. */
  font: { row: { number: 13, word: 7 }, panel: { number: 15, word: 8 } },
  wordLetterSpacing: 0.3,
} as const;

export const EMPTY_PILE = { border: 1.5, color: alpha(color.onBaize, 0.6) } as const;

export const AD = { border: 1.5, color: alpha(color.onBaize, 0.5) } as const;

/** Dim behind the guide card. */
export const SCRIM = alpha('#0A1810', 0.72);

export const BUTTON = {
  height: { regular: 48, sheet: 52, hero: 56 },
  radius: { regular: 10, hero: 12 },
  border: 1.5,
  padH: 20,
} as const;

/** Opacity of an eliminated player's row. */
export const OUT_OPACITY = 0.6;
