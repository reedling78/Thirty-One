# ThirtyOne — Card component spec

Companion to `tokens.ts` and `cardArt.ts`. Everything here matches the Design canvas as of 2026-10-11.

## Components

`<Card rank suit size faceUp back onPress accessibilityLabel />`

- `size`: `small | normal | hand | large` (34×48 / 64×92 / 76×109 / 88×126 dp). Cards never text-scale. The table uses `small`, `hand` and `large`; `normal` is kept as a reference size.
- `faceUp: false` renders the back; `back` is the user's `BackColor` setting (default `blue`).
- `onPress` only exists on your hand (discard) and the two piles (draw). Opponent cards and rules examples are non-interactive `accessibilityRole="image"`.
- Accessible name is always `cardLabel(rank, suit)`; hand cards append ", tap to discard"; the back is "Face-down card".

## Face anatomy

**small (34×48)** — flat icon card. Rank at 11 pt ExtraBold in the top-left (3 dp inset) and the same rank rotated 180° in the bottom-right. One 20 dp suit pip centred (x 6, y 13). No corner pips, no court figure. Border is a soft 30% ink hairline.

**normal / hand / large** — full anatomy.
- Index: rank over a small pip, top-left; mirrored (rotated 180°) bottom-right. Sizes in `SIZE[size].index`.
- Number cards 2–10: pips from `pipPositions(rank, size)` — three columns, lower-half pips rotated 180°. This is the traditional pattern; a 7 is recognisable before you read the index.
- Ace, Jack, Queen, King: one large centre pip at `SIZE[size].bigPip`. No court figures — the index letter distinguishes them and the big pip keeps the suit readable at a glance.

Suit colour is applied on top of the pip shape, never instead of it — the four pips differ by silhouette, so the faces survive greyscale.

## Counting marks (hand size only)

While a hand is in play (not at the reveal), cards in the best suit — or all three for three of a kind — carry a 4 dp gold (`color.turnBar`) rule along the inside of their bottom edge; every other card sits at 70% opacity. Recomputed with the hand value on every draw and discard. The mark is decoration on top of the hand-value text, never the only signal.

## Back

White stock (`color.cardFace`) with a 1 dp ink border, inset by `BACK.padding[size]`, containing a panel of `color.back[setting]` with a cream diamond lattice: 1 dp lines at +45° and −45° every `BACK.latticePeriod[size]` dp. Four colourways, one pattern; chosen in Settings → Card back. No emblem.

Easiest RN implementation: export the lattice as a small tiling PNG per size (2× and 3×) and use `ImageBackground` with `resizeMode="repeat"`, tinting the panel colour underneath. The SVG route (two `Pattern`s) also works but is heavier on the 10-seat table.

## Where cards appear

| Place | Size | Interactive |
| --- | --- | --- |
| Opponent rows (hidden) | small back | no |
| Opponent rows (reveal) | small face | no |
| Rules examples | small face | no |
| Your hand | hand face, lifted shadow, counting marks | yes — discard |
| Your hand between rounds | hand back | no |
| Deck | large back | yes — draw |
| Discard top | large face | yes — take |
| Empty discard | 88×126 dashed outline, "empty" | no |

## Fonts

Bricolage Grotesque Bold/ExtraBold for ranks; Atkinson Hyperlegible is not used on cards. Load both with `expo-font` and reference by the names in `tokens.type`.
