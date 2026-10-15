# Build prompt — ThirtyOne visual skin

Paste into Claude Code from `~/Documents/Github/Thirty-One`. One slice per session; commit at the end of each.

---

You are implementing the visual design for ThirtyOne, a React Native + Expo (expo-router, pnpm workspace) card game. The playable greybox already exists in `apps/mobile`; your job is to re-skin it to the design, not to change game logic. `packages/rules` and `packages/bots` are off limits.

**Read first, in this order:**
1. `~/Documents/ThirtyOne/Design/Design.md` — every design decision and why. Follow it; where you are tempted to deviate, stop and ask.
2. `~/Documents/ThirtyOne/Design/Card Spec.md` — card anatomy at three sizes.
3. `~/Documents/ThirtyOne/Plans/Design Brief.md` — the approved table layout and the four accessibility commitments. The layout is settled; do not rearrange it.
4. `apps/mobile/src/components/greybox/*` — the components you are re-skinning. Keep their props and the `TableClient` contract untouched.

**Source files already written:** copy `~/Documents/ThirtyOne/Design/tokens.ts` and `cardArt.ts` to `apps/mobile/src/theme/`. Treat them as the single source for colour, type, spacing, radius and card geometry. Never hard-code a hex or a font size in a component.

**Hard rules**
- No state is colour-only: every state keeps its bar, its fill AND its word. Red is only ever a suit colour.
- Every text style multiplies by `PixelRatio.getFontScale()`; cards, chips and the ad slot do not scale. Nothing may clip or overlap at the largest accessibility size — test at 1.3×.
- Nothing moves within a game: the header band is a fixed two-line height, the ad slot is fixed, each opponent row reserves two status lines, and only the opponent list and the pile area flex. The player's panel sits at the same y in every state; the piles sit at the same y for a given seat count.
- Every card, seat, pile, chip and button has an accessible name (`cardLabel()` for cards).
- Fonts: add Bricolage Grotesque (700, 800) and Atkinson Hyperlegible (400, 700) via `expo-font`, named as in `tokens.type`. Add `react-native-svg` for pips and the chip ring.
- After each slice run `pnpm check` and fix what it reports before committing.

**Slice 1 — theme and fonts.** Add the two token files, the fonts, `react-native-svg`. Replace the greybox colours and text styles with tokens app-wide (background baize with the felt speckle, paper panels). App should look re-coloured but otherwise identical. Commit.

**Slice 2 — Card.** Rebuild `CardView` to the spec: four sizes (the table uses small, hand and large), number pip layouts from `pipPositions()`, one big centre pip for A/J/Q/K, mirrored indices, small-card icon layout, and the lattice back in the four colourways (tiling PNG at 2×/3× preferred over SVG patterns). Add a `backColor` setting (AsyncStorage) and the Card back row in Settings. Add a dev screen or story that shows every rank and suit at every size and in greyscale. Commit.

**Slice 3 — Chip, pill, dealer button, header band.** Chip: SVG ring with a Text layer for the number, BUS inverted, OUT dimmed. KNOCKED pill, dealer disc. The header band is the action island (Design.md › The header is the action island): the screen's navigation bar, painted in the four tones, with the chevron, headline over guide line, and no button; it extends behind the status bar (SafeAreaView edges top with the band's colour). No separate island component. Commit.

**Slice 4 — Table.** Re-skin `PlayerRow` (waiting / playing / knocked / revealed / revealed-loser with the grey-brown loser treatment), the player's panel with the hand on top (hand size, lifted shadow, counting marks: gold bottom rule on cards in the best suit, dead cards at 70%, off at the reveal) and the "You · value" line with the chip beneath it, the piles (no captions; counts in accessibility labels only; dashed empty-discard placeholder), the player's panel, and replace the event log with a fixed 320×100 ad slot placeholder, put KNOCK / Deal in a reserved 104 dp slot to the right of the discard (deck → discard → action; slot always present so the piles never shift; ink button with cream outline, 52 dp tall, lifted shadow; empty when nothing is pressable; at the reveal the deck and discard render at 45% opacity and are disabled), and centre the pile row in the space between the opponent list and the panel (list at natural height, pile area flex with 150 pt minimum, list scrolls beyond that). Verify the hand never moves across the five states and the piles never move within one seat count, at 2, 6 and 10 seats and 1.3× text. Commit.

**Slice 5 — Row callouts.** When a player knocks, folds, double-folds, or hits 31, overlay that row's name-and-action block with KNOCKED! / FOLDS! / DOUBLE FOLDS! / THIRTY ONE! in the row's own state fill, hold 3 s, fade 600 ms (Reanimated), respecting Reduce motion (no fade, just the hold). Announce via `AccessibilityInfo.announceForAccessibility`; trigger the existing haptic/sound from `useFeedback`. A 31 also puts the 31 row in the gold active treatment and every other seat (yours included) in the loser treatment, per Design.md. Commit.

**Slice 6 — Other screens.** Home, Rules (seven example hands with small cards), Settings, Results, guide overlay, per the canvas. Commit.

Do not add features, screens, copy or animations that are not in Design.md. If something in the design cannot be built as specified, say so and propose the smallest change — do not silently substitute.
