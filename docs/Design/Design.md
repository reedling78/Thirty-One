# ThirtyOne — Design

The design decisions for the practice release, as settled on the Claude Design canvas on 2026-10-11. The method is in [[Design Plan]]; the brief is [[Design Brief]]. The canvas is the source of truth for how things look; this page is the source of truth for *why*.

**Canvas:** https://claude.ai/artifact/LACRZUeD3uPc36K4BCnXW9
**Canvas source:** `canvas/` in this folder — a snapshot of the canvas files (see `canvas/README.md`).
**Code:** [`tokens.ts`](../../apps/mobile/src/theme/tokens.ts) and [`cardArt.ts`](../../apps/mobile/src/theme/cardArt.ts) in `apps/mobile/src/theme/` are the only copies (see [[Design Plan]] › Where the design lives). [[Card Spec]] describes the card component.

## Direction

**Pub table.** Deep green baize ground with a felt nap (a fine light speckle, a coarser dark speckle, and a soft pool of light at the top of the table). Cream paper panels for rows, the island and your hand. The two piles sit directly on the felt, which makes them the focal point with no extra emphasis.

Type: **Bricolage Grotesque** (700/800) for display, titles, card ranks, chip numbers and buttons; **Atkinson Hyperlegible** for everything else, chosen because 13 pt status lines are the hard legibility case and it disambiguates 1/I/l and 0/O.

## Decision records

**Baize ground, paper panels.** Cards on felt is the mental model of the game. The piles are the only large cream objects on bare baize, so they read as the centre of the table without decoration.

**Red is never a state colour.** It is the colour of hearts and diamonds and nothing else. The first loser treatment (red bar, red fill, red text) read as an error and was replaced.

**State is bar + fill + word.** Active: gold edge bar, gold fill, bold "Playing now" with a triangle. Knocked: orange bar, tint, KNOCKED pill. Lost: dark grey bar, grey-brown fill, verdict and score in ink. Any one of the three can be removed and the state still reads.

**The header is the action island (2026-10-12).** There is no separate island panel and no round number in the header. The navigation bar itself carries the moment, edge to edge and up behind the status bar: the back chevron on the left and the headline (19 pt display) over one guide line. No button in the band. Four tones: neutral cream, your-turn gold, knock burnt orange (cream text), reveal ink (cream text); KNOCK and Deal share one ink button, which gains a cream outline on the ink tone. The band hugs its content: safe-area inset, 6 pt, headline, guide, 10 pt — about 60 pt below the status bar at 1×. No extra minimum. Reveal reads "Hands revealed" with the outcome on the guide line; a 31 reads "bot2 has 31!". Chosen over a separate island (doubled message, 76 pt of felt) and over no island at all (lost the one big signal of the moment): on your turn the whole top of the phone goes gold. Announce the band as a status to screen readers.

**The action button sits beside the discard (2026-10-12).** KNOCK and Deal live in a reserved 104 pt slot to the right of the discard pile, vertically centred with the piles: deck → discard → action, left to right, so draw, throw and knock are one thumb-reach. The slot is always present (empty when there is nothing to press) so the piles never shift. Ink button, cream outline, 52 pt tall, lifted shadow. This also keeps the header band to two lines of text, which is what fixed its height. At the reveal, when Deal is the only action, the deck and discard dim to 45% and are not tappable — the button is the one live thing in the row.

**Piles are centred in the free space.** The opponent list takes its natural height; the deck and discard float in the middle of whatever is left above the player's panel, never less than 150 pt. From about seven seats the list scrolls to protect that minimum. The piles therefore sit at a fixed spot within a game, but at a different spot in a 2-seat game than a 6-seat one — that is accepted.

**Your hand sits above your name.** The player's panel stacks cards first, then the "You · 20 in clubs" line with the chip (score at the reveal). The cards are the content; the value line is their caption, and the hand sits closer to the piles.

**Row callouts.** When a player knocks, folds, double-folds, or hits 31, a stamp (KNOCKED! / FOLDS! / DOUBLE FOLDS! / THIRTY ONE!) covers that row's name-and-action block for 3 s, then fades over 0.6 s to reveal the already-updated name and status. It uses the row's own state fill, 24 pt (18 pt for the long ones), ink, flush left; the cards and chip stay visible. Announce it as a status to screen readers; fire haptic and sound with it.

**A 31 ends the round on the spot.** The 31 row takes the gold active treatment with the verdict "31!"; every other row (and your panel) takes the loser treatment with "folds a corner"; the header reads "bot2 has 31!" / "Everyone else folds a corner." with Deal.

**Nothing moves within a game.** Every row reserves two status lines, the header band is a fixed two-line height, the ad slot is a fixed height, and the opponent list and the pile area are the only elements that flex — so your hand is at the same y in every state, and the piles are at the same y for the whole game.

**Ad slot, not an event log.** The bottom of the table is a 320×100 large-banner slot (124 pt with padding), not text-scaled. The event log was dropped; the opponent status lines already carry the last move.

**Pile labels dropped.** The deck and discard carry no caption and no count on screen; the counts remain in the accessible names.

**Card faces.** Traditional anatomy at normal (64×92) and large (88×126): corner indices mirrored, number pips in three columns with the lower half rotated, and one big centre pip for A, J, Q and K. Court figures were drawn and then dropped (2026-10-12): the index letter is enough, and a big symbol keeps the suit readable at a glance. The small card (34×48) is a flat icon card: 11 pt rank top-left and mirrored, one 20 pt centre pip, no corner pips.

**Card back.** White stock, solid colour panel, cream diamond lattice (1 pt lines at ±45°, period 7/6/4 pt by size). No emblem. Four colourways — blue (default), red, green, black — chosen in Settings › Card back. One pattern, so a hidden card reads the same whichever is picked.

**Chip.** Eight edge notches, dashed inner ring, the count of corners left in the middle (13 pt rows / 15 pt panel). Last life inverts to ink and reads BUS; eliminated dims to OUT. The number is a text layer over the ring, not SVG text.

**Hand value beside your name.** "20 in clubs", "30 — straight", "31!" recomputed on every draw and discard, so new players never add up.

**Secondary screens.** Rules and Settings put content on a cream sheet over the felt; Home and Results stay on bare felt with cream type. Settings gained a Card back row with four back-shaped radio swatches.

**App icon (2026-10-12).** The lives chip with a 31 in the centre, in the BUS colourway: ink chip, gold notches and rings, gold Bricolage 31, on felt. Chosen over the cream chip (A) and cream-on-black (C) for contrast on a home screen. Full-bleed 1024 square for iOS; Android adaptive layers with the chip at 80% inside the safe zone, a bare felt background, and a white ring-and-31 monochrome; splash icon is the chip on transparent over #1E5236. Files live in [`apps/mobile/assets/images/`](../../apps/mobile/assets/images/) (`icon.png`, `splash-icon.png`, `android-icon-*.png`).

**Dark mode deferred.** Swap paper↔ink and darken baize one step; island tones, suit red and state colours stay. Every text colour is named against a named ground, so nothing assumes light.

## Open


- Whether your own panel gets the FOLDS! stamp when you lose (layout supports it; not drawn).
- Adaptive banner vs fixed 320×100 — if adaptive, size the slot to the max and bottom-align the ad.
