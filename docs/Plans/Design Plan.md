# ThirtyOne — Design Plan

## Scope

This page says how the table screen and the design system get made and where the result lives. [[Design]] will hold the design decisions themselves once they exist; this page is the method.

**Rewritten 2026-10-02.** The earlier version set ThirtyOne up as a Cowork project reusing the Chicago transit tracker's design-export ingest skill. That was rejected on 2026-10-01: this app is built from this vault and its own repo, not from that structure. The brief constraints and the two boundaries below survive from the earlier version; the ingest tooling does not.

## Decisions

### Where the design lives

**The design system lives in the code repo**, at `apps/mobile/src/theme/` — tokens as `tokens.ts`, components beside the screens that use them — versioned by git like everything else. The Expo app is its only consumer, so there is nothing to share and no reason for a separate package or project. It moves to a `packages/ui` only if a second app ever needs it.

The vault holds the **brief** (this page) and the **decisions** ([[Design]]). Claude Design can see neither the vault nor the repo, so the brief has to be self-contained whichever tool produces the design.

### Greybox first, design second

The design is made **after** the greybox table from [[Implementation Plan]] Milestone 4 is playable, not before. The greybox answers questions a static design cannot: whether ten seats fit on the smallest phone at the largest text size, how often the discard pile reshuffles, what the hand-value display needs to say mid-turn. The brief is written from what the greybox taught, and the design is then checked against real play rather than against a mock-up.

### What the greybox taught (2026-10-08, first play)

Reed's notes after playing the four-seat greybox, applied to the greybox the same day and carried into the brief:

- **Opponents' cards can be much smaller.** Their seats are status, not play: name, card count, corners, whose turn. They should not compete with the player's own hand.
- **The round needs a real reveal — on the table, not a separate screen.** At the end of every round the opponents' rows flip face-up with their scores, the losing rows are tagged ("lowest — folds a corner"), the player's own hand gets the same verdict, and a banner summarises the round with a Continue button. It waits for the player, not a timer. A separate reveal screen was tried first and dropped the same day: once opponents are rows, the reveal is just those rows face-up. The engine puts the penalties in the round result so the table shows exactly what is about to happen.
- **The deck and discard pile should be bigger.** They are the two things you tap every turn; they are the focal point of the table.
- **Opponents as rows, the same on the table as at the reveal.** Reed liked the reveal's row — name and status on the left, small cards in the middle, one big figure on the right — and asked for it on the table too. During play the cards are face-down and the figure is corners folded (`2/4`, `BUS`, `OUT`); at the reveal the cards flip and the figure becomes the score. One `PlayerRow` component serves both, stacked vertically. This is the first settled layout decision for the brief.
- **Lives are a poker chip.** Corners left shown as a chip — ring with a dashed inner edge, the number in the middle, `BUS` (inverted) on the last life, `OUT` dimmed. It is the right-hand figure on every opponent row during play and sits in the top-right of the player's own panel. Counts *down* (corners left), not up (corners folded).
- **Cards are coloured.** Hearts and diamonds red, clubs and spades black — on top of the suit symbol, never instead of it, so the accessibility commitment holds.
- **The action island.** A permanent panel between the status line and the opponents' rows: a title, one line of guidance, and at most one button on the right. It is the only place the game speaks ("Your turn — draw from the deck or the discard", "bot2 is playing", "bot2 knocked — this is your last turn", "You knocked — hands revealed · bot1 folds a corner") and the only place the two non-card actions live: **KNOCK** appears there when, and only when, you may knock; **Continue** appears there at the reveal. Its tone changes with the moment (grey at rest, black border on your turn, yellow for a knock, grey fill at the reveal) and its height never does. Grew out of the reveal banner, which Reed liked and asked to make permanent.
- **A knock is an event.** When anyone knocks, a banner stays for the rest of the round, changing to "this is your last turn" when it reaches you, with the knocker's seat marked. The Knock button lives in the action island, only on your turn and only when your hand is complete — so its appearance is itself the signal that you may knock. (Beside the piles was tried first.)
- **Nothing moves.** The player's panel is pinned to the bottom and the banner slot, hint line and event log reserve their height, so appearing and disappearing content never shifts the piles or the hand.

### First brief: table screen and core tokens

Not all eleven screens. Nine belong to slices 2–4 in [[Scope]] and would drift before they are built.

**Constraints to carry into the brief:**

- Practice is a **four-seat table**. The layout must also work at **2, 6 and 10 seats** — ten is the working cap in [[App Features]], and the design confirms or reduces it with the greybox evidence.
- The four accessibility commitments from [[App Features]], which shape the screen rather than following it:
  - Suits carry information by symbol and shape, never red against black alone
  - Text scales with the system text size
  - The turn timer is a number and a shrinking bar, never a colour change
  - Cards, seats and buttons are labelled, for VoiceOver and TalkBack
- A seat shows: display name, picture, corner count and bus state, disconnect marker (slot only in slice 1), and whether it is their turn
- The table shows: draw pile, discard pile face up, every player's hand (face down until the reveal), and the player's own hand value with the suit carrying it — in every game, not just practice
- Visual vocabulary from [[Rules]]: three-card hands, corners folding as lives, "on the bus", knocking
- Card faces and backs must be **original artwork**, not a reference to an existing deck
- Platform: React Native + Expo, phone first ([[Tech Stack]])

**Deliverables to ask for:**

| Deliverable | Why |
| --- | --- |
| Core tokens — colour, type, spacing, radius | The foundation, delivered as something that maps cleanly onto `tokens.ts` |
| Card face and card back | Suit treatment without colour dependence is the accessibility crux |
| Seat component | Name, picture, corners and bus, disconnect slot, active turn |
| Table layout at 2, 4, 6 and 10 seats | Four is what ships in slice 1; ten decides the cap |
| Turn timer | Number plus shrinking bar |
| Hand value display | Total, and which suit carries it |
| Decision records with rationale | Matches [[Tech Stack]]'s pattern |

**Out of scope for this brief:** the other ten screens, chat, Live Game Room listings, profile, groups.

### Bringing the design into the repo

Whatever the export looks like, it is **transcribed into `tokens.ts` by hand or by a small script, then committed** — there is no automated ingest. Two checks before it lands:

- Every text/background pair clears **4.5:1** contrast. Any that fails becomes an entry in [[Design]] carrying both options and their cost.
- Suit artwork is distinguishable **in greyscale**.

Two boundaries, kept from the earlier version:

- **Never pick a replacement hue** for a failing contrast pair on your own. It is a design decision, recorded as one.
- **Never edit a token** to make a check pass. Fix the design or record the exception.

## Build order

1. Greybox table playable ([[Implementation Plan]] Milestone 4)
2. Write the brief from this page plus what the greybox taught
3. Run the design pass
4. Transcribe tokens into `apps/mobile/src/theme/tokens.ts`; run the contrast and greyscale checks
5. Build the card, seat, timer and hand-value components on the tokens ([[Implementation Plan]] Milestone 5)
6. Write [[Design]] — the findings, the seat cap recommendation, and the decision log

## Verification

**The design has answered its question when:**

- [[Design]] states the seat count the table carries comfortably, with the layout that demonstrates it, and [[App Features]] and [[Scope]] agree with it
- Suit artwork is distinguishable in greyscale
- The timer reads as number and bar, with no colour-only state
- Every contrast pair either clears 4.5:1 or is recorded in [[Design]] as a decision
- Nothing clips or overlaps at the largest system text size at four seats, and the ten-seat case is documented either way

## Decision log

| Date | Decision | Why |
| --- | --- | --- |
| 2026-10-01 | First brief is the table screen plus core tokens | The table screen gates slice 1 and carries the seat-cap question. The other ten screens belong to later slices and would drift before being built. |
| 2026-10-01 | Table layout requested at 2, 6 and 10 seats | Ten is the case that decides whether [[App Features]]'s cap survives; the smaller cases show whether one layout stretches across the range. |
| 2026-10-01 | Cowork-project / ingest-skill setup rejected | This app is built from this vault and its own repo, not from the transit tracker's structure. |
| 2026-10-02 | Design system lives in the repo at `apps/mobile/src/theme/` | The Expo app is its only consumer. Vault holds brief and decisions; repo holds tokens and components. |
| 2026-10-02 | Greybox first, design second | The greybox answers seat-count and reshuffle questions a static design cannot, and gives the design something real to be checked against. |
| 2026-10-02 | Four-seat layout added to the brief | Practice ships at four seats, so that is the case that must be right first. |

## Open questions

None at present.
