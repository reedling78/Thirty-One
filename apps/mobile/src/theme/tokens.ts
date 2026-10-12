/**
 * ThirtyOne design tokens — transcribed from the Design canvas (2026-10-11).
 * Light mode. Every value here is a token the canvas uses; nothing is invented.
 *
 * Fonts (bundle with expo-font):
 *   Bricolage Grotesque 700 / 800  — display, titles, card ranks, chip numbers, buttons
 *   Atkinson Hyperlegible 400 / 700 — everything else
 */

export const color = {
  // grounds
  baize: '#1E5236', // screen ground (felt)
  paper: '#F6F1E4', // rows, panels, sheets
  cardFace: '#FDFBF4', // card stock
  rule: '#D8CFB8', // hairlines, outlines

  // text
  ink: '#17150F',
  inkSecondary: '#5B5648', // status lines, captions (6.2:1 on paper)
  onBaize: '#F6F1E4', // primary text on the felt
  onBaizeSecondary: '#D7E3D6',

  // suits — the only place red is used
  suitRed: '#B8322B',
  suitBlack: '#17150F',

  // state (always paired with a shape and a word)
  turnBar: '#C9961A',
  turnFill: '#FBF0CF',
  knockBar: '#A8461A',
  knockTint: '#F9E3C8',
  loserBar: '#5B5648',
  loserFill: '#E6DECB',

  // action island tones
  island: {
    neutral: { bg: '#EFE7D3', fg: '#17150F' },
    yourTurn: { bg: '#F2C14E', fg: '#17150F' },
    knock: { bg: '#A8461A', fg: '#FFF4E6' },
    reveal: { bg: '#17150F', fg: '#F6F1E4' }, // button gets a cream outline here
  },

  // chip
  chip: {
    face: '#FDFBF4',
    ring: '#17150F',
    busFace: '#17150F',
    busRing: '#F6F1E4',
    outFace: '#E6E0D0',
    outRing: '#9A948A',
    outText: '#6F695F',
  },

  // card back colourways (user setting)
  back: {
    blue: '#1F3A8A',
    red: '#B8322B',
    green: '#245B3F',
    black: '#2A271F',
  },
  backLattice: 'rgba(253,251,244,0.92)',

  gold: '#F2C14E', // crown / tiara / feather on court cards
} as const;

export type BackColor = keyof typeof color.back;

/** Sizes are at 1×; multiply by the system font scale at runtime. */
export const type = {
  display: {
    family: 'BricolageGrotesque-ExtraBold',
    size: 28,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  title: { family: 'BricolageGrotesque-Bold', size: 18, lineHeight: 22 },
  body: { family: 'AtkinsonHyperlegible-Regular', size: 16, lineHeight: 22 },
  label: { family: 'AtkinsonHyperlegible-Bold', size: 15, lineHeight: 20 },
  status: { family: 'AtkinsonHyperlegible-Regular', size: 13, lineHeight: 18 },
  pill: { family: 'AtkinsonHyperlegible-Bold', size: 10, lineHeight: 14, letterSpacing: 0.8 },
  callout: {
    family: 'BricolageGrotesque-ExtraBold',
    size: 24,
    lineHeight: 24,
    letterSpacing: 0.25,
  },
  calloutLong: { family: 'BricolageGrotesque-ExtraBold', size: 18, lineHeight: 18 }, // "DOUBLE FOLDS!"
  score: { family: 'BricolageGrotesque-ExtraBold', size: 24, lineHeight: 24 }, // 26 in your panel
  button: { family: 'BricolageGrotesque-ExtraBold', size: 15, lineHeight: 18, letterSpacing: 0.6 },
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;

export const radius = { sm: 4, md: 6, card: 8, panel: 12, pill: 999 } as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  pile: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  lifted: {
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
} as const;

/** Fixed layout constants from the table screen. Not text-scaled. */
export const layout = {
  islandHeight: 76, // × text scale
  rowMinHeight: 58, // name line + two status lines, × text scale
  stateBarWidth: 4,
  adSlot: { width: 320, height: 100, outerHeight: 124 }, // large banner
  calloutHoldMs: 3000,
  calloutFadeMs: 600,
} as const;

export const tokens = { color, type, space, radius, shadow, layout } as const;
export default tokens;
