# ThirtyOne — Design Brief

*Self-contained: this is everything a designer (or Claude Design) needs. It does not assume access to the rest of the vault. Written 2026-10-11 from a play-tested greybox; the layout below is approved, the brief is for the visual skin and the card art.*

## The game in one paragraph

ThirtyOne is a mobile card game for 2–10 players, based on the pub game Thirty-One. Everyone holds three cards. On your turn you draw one (from the face-down deck or the face-up discard) and throw one. Only cards in one suit count: Ace 11, face cards and tens 10, the rest face value; three of a kind or three in a row in one suit score a flat 30; Ace plus two ten-value cards in one suit is 31 and wins the round instantly. When you think you won't be lowest — and only when all three of your cards count — you knock instead of taking your turn; everyone else gets one more turn, then all hands are shown and the lowest loses a life. Lives are a chip with four corners to fold; fold the fourth and you're "on the bus" — one more loss and you're out. Last player standing wins the pot. It is played for chips, never money.

The first release is **practice only**: one human against three computer opponents, on one screen, with a home screen, a rules screen, and settings. Multiplayer comes later and reuses the same table.

## Platform and constraints

- React Native + Expo, **phones only**, portrait. Design for the smallest supported phone (iPhone SE class, 375 pt wide) first.
- Deliver as **design tokens** (colour, type scale, spacing, radius, shadow) that transcribe cleanly into a TypeScript object, plus the card artwork. We will build the components ourselves from the tokens; a reference render of each screen state is what we need, not a component library.
- Light mode first. Dark mode welcome if it falls out of the token structure naturally.
- **Card artwork must be original.** No reference to, or likeness of, any existing deck design.

## Four accessibility commitments — these shape the design, they are not a later audit

1. **Suits never rely on colour alone.** Hearts and diamonds may be red and clubs and spades black, but the suit symbol carries the meaning. The card faces must be distinguishable in greyscale.
2. **Text scales.** Every text style follows the system text size. Nothing may clip or overlap at the largest accessibility size, including the four-seat table.
3. **No state is colour-only.** Whose turn, who knocked, who lost, on the bus — each has a shape, a word, or a mark as well as a colour.
4. **Everything is labelled.** Every card, seat, pile and button has an accessible name. (We handle the labels in code; the design just needs to not fight it — e.g. no information carried only by a decorative image.)

## The table screen — approved layout, top to bottom

This layout has been played for a week and refined; keep it. The brief is for how it looks, not where things go.

1. **Header** (native navigation bar): back chevron, title "Practice · Round 3".
2. **The action island.** A fixed-height panel (never changes height). Left: a bold title and one line of guidance. Right: at most one button. States, with tone:
   - Your turn, three cards — "Your turn" / "Draw from the deck or the discard." — *your-turn tone*
   - …and your hand is complete — same, plus the **KNOCK** button on the right
   - Your turn, four cards — "Your turn" / "Tap a card to discard."
   - Someone else's turn — "bot2 is playing" / "Waiting for your turn." — *neutral tone*
   - After a knock — "bot2 knocked" / "One more turn each, then the reveal." or "…this is your last turn." — *knock tone*, held for the rest of the round
   - Reveal — "bot3 knocked — hands revealed" / "bot1 folds a corner." + **Continue** button — *reveal tone*
   - Between rounds — "Dealing…"
3. **Opponent rows**, stacked vertically, one per opponent (three in practice; design for up to nine). Each row, left to right: name, a **D** dealer button when they dealt, a **KNOCKED** pill if they knocked; under the name one line of status — "▶ Playing now" on their turn, otherwise their last move ("took A♠ from the discard, threw 9♥", "drew from the deck, threw 4♦", "knocked"); in the middle three **small face-down cards**; on the right the **chip** (see below). The active row has a thick bar down its left edge, a light fill and the bold "Playing now" line. The knocker's row is tinted. At the reveal the small cards flip face-up, the status line becomes the verdict ("lowest — folds a corner", "knocked — safe", "31!"), the chip becomes the **score** in large type, and losing rows go red.
4. **The piles**, centred, with breathing room above and below: the **deck** (face-down, large) and the **discard** (face-up, large), each labelled underneath ("Deck · 32", "Discard · 8"). These are the two things tapped every turn; they are the focal point of the table.
5. **The player's panel**, pinned below the piles, never moves. Header line: "You", dealer button and KNOCKED pill when applicable, then the current **hand value** ("20 in clubs", "30 — straight", "31!") beside the name, and the **chip** top-right (replaced by the score at the reveal). Below: the hand — three cards, four between a draw and a discard — **large**, tappable to discard. The panel takes the same active-turn treatment as a row (left bar, fill) on your turn, and goes red at the reveal if you lost.
6. **The event log**, filling the remaining height to the bottom: the last seven things that happened, in plain words, with card mentions in suit colour.

## Components to design

| Component | Notes |
| --- | --- |
| **Card face** | Three sizes: small (opponent rows, ~28×40), normal (your hand, ~64×92), large (piles, ~88×126). Rank and suit symbol must read at the small size. Suit colour on top of the symbol, never instead of it. |
| **Card back** | Used for the deck and for opponents' hidden cards. Should read as "a card" at 28×40. |
| **Chip** | A poker chip: outer ring, dashed inner ring, the number of corners left in the middle (4 down to 1). On the last life it inverts and reads **BUS**. Eliminated reads **OUT**, dimmed. Sizes ~32 (rows) and ~36 (panel). |
| **Dealer button** | A small white disc with a D, poker style. |
| **KNOCKED pill** | Small, high-contrast, all caps. |
| **Action island** | Four tones: neutral, your-turn, knock, reveal. One button style (black, white text) used for KNOCK and Continue. |
| **Opponent row** | Three states: waiting, playing now, knocked; plus revealed and revealed-loser. |
| **Player panel** | At rest, your turn, knocked, revealed-loser. |
| **Piles** | Deck with count, discard with count, empty-discard placeholder (dashed outline). |
| **Event log line** | Small, secondary, with inline card mentions in suit colour. |
| **Buttons** | Primary (filled black), secondary (outlined). Used on home, settings, results. |

## Other screens (secondary; same tokens)

- **Home**: title "ThirtyOne", one line of tagline, three stacked buttons — primary "Learn to play" / "Play practice", secondary "How to play" and "Settings".
- **Rules**: headed prose sections; a list of seven example hands, each as three small cards + score + one line of explanation.
- **Settings**: three toggles (Sound, Haptics, Reduce motion) with one-line descriptions; a "Test sound and haptics" button; a "Replay the guided first game" button.
- **Results** (end of game): "You win!" or "bot2 wins", the finishing order, "Play again" / "Home".
- **Guide overlay**: a card over a dimmed table with a title, a short paragraph, "Skip the guide" (text link) and "Got it" (primary).

## Deliverables

1. Core tokens: colour (including the four island tones, the turn fill, the knock tint, the loser red, suit red), type scale, spacing, radius, shadow.
2. Card face and card back, shown at all three sizes, in colour and in greyscale.
3. Chip at 4, 3, 2, 1, BUS, OUT.
4. The table screen in five states: your turn (hand complete, KNOCK showing), opponent's turn, after a knock, the reveal (with a loser), and between rounds.
5. The table at **2, 6 and 10 seats** — ten decides whether the cap survives on a small phone at large text.
6. Home, Rules, Settings, Results, and the guide overlay, one state each.
7. Short decision records: for each non-obvious choice, what it is and why.

## Out of scope

Multiplayer screens (lobby, chat, profile, friends, groups), onboarding and sign-in, app icon and splash (next brief).
