# Thirty-One — Rules

A card game played with a standard 52-card deck. Players build a three-card hand
worth as many points as possible; the lowest hand at the end of each round loses
a life. Last player still in wins the pot.

## Setup

- **Players:** 2 or more.
- **Deck:** standard 52-card deck, no jokers.
- **Deal:** each player is dealt **3 cards**, face down, kept hidden.
- **Piles:** two piles sit in the middle of the table —
  - **Draw pile** — the rest of the deck, face down.
  - **Discard pile** — face up, started with the top card of the draw pile.
- **Turn order:** play starts with the player to the **left of the dealer** and
  moves left around the table.
- **Buy-in:** every player puts in one chip (see [The Pot](#the-pot)).

## Card Values

| Card | Value |
| --- | --- |
| Ace | 11 |
| King, Queen, Jack | 10 |
| 10 | 10 |
| 2 – 9 | face value |

## Scoring a Hand

A hand is always exactly **3 cards**. Its score is the **sum of the cards in a
single suit** — you add together only the cards that share a suit, and you take
whichever suit gives you the highest total. Off-suit cards contribute nothing.

Two special hands score a flat **30**:

- **Three of a kind** — three cards of the same rank, any suits (e.g. 3♥ 3♣ 3♦).
- **Straight** — three cards in sequence, **all of the same suit** (e.g. 3♥ 4♥ 5♥).
  The Ace plays **high or low**, so both A-2-3 and Q-K-A are valid straights.

All 30s are equal. A straight, three of a kind, and 30 made from suited cards
all tie with each other.

**31 is the maximum and wins instantly.** It can only be made with an Ace plus
two ten-value cards in the same suit (11 + 10 + 10).

> A suited Q-K-A is both a straight and 31. Always take the better reading — it
> scores **31**, not 30.

### Example hands

| Hand | Total | Why |
| --- | --- | --- |
| 2♣ 10♣ 2♦ | **12** | Clubs: 2 + 10. The 2♦ is off-suit. |
| 2♥ 10♣ 9♦ | **10** | No two cards share a suit, so the best single card is the 10♣. |
| K♥ 6♣ Q♥ | **20** | Hearts: 10 + 10. |
| K♥ A♥ Q♥ | **31** | Hearts: 10 + 11 + 10 — instant win. |
| 3♥ 3♣ 3♦ | **30** | Three of a kind. |
| 3♥ 4♥ 5♥ | **30** | Straight in hearts. |
| A♠ 2♠ 3♠ | **30** | Straight, Ace low (beats the 16 it would score as suited cards). |

## Playing a Round

Play passes to the left. On your turn:

1. **Draw one card** — either the face-up top card of the discard pile, or the
   unknown top card of the draw pile.
2. **Discard one card, face up**, onto the discard pile. You are momentarily
   holding four cards and must come back down to three.

Everything visible is information: what you discard and whether you take from
the discard pile both tell the table what suit you are chasing. Reading those
signals is part of the game.

If the **draw pile runs out**, shuffle the discard pile (leaving its top card in
place as the new discard) and use it as a fresh draw pile.

### Knocking

When you think your hand is high enough that you will not be the lowest at the
table, you can **knock on the table instead of taking your turn**.

- Knocking waives your draw and discard for that turn.
- **You may only knock when all three of your cards count** — three of one
  suit (a straight and 31 included) or three of a kind. A hand with an
  off-suit card cannot knock. *(Added 2026-10-09.)*
- You may knock on **your very first turn** — no minimum number of rounds.
- Every other player then gets **one more turn**, and **no one else may knock**.
- When play comes back around to the knocker, **everyone reveals their hands**.
- The **lowest hand loses** the round.

### Losing the round

- The player with the **lowest total folds a corner**.
- **Ties for lowest:** every tied player folds a corner.
- **Knocker penalty:** if the player who knocked ends up with the lowest hand
  (alone or tied), they fold **two corners** instead of one.

### Instant win — 31

If a player reaches **31**, the round ends on the spot — in the app it is
declared automatically. It counts the moment **any three cards in hand** make
31, including right after a draw while the player is holding four. **Every other player folds a corner** — not just the lowest hand.

## The Pot

- Each player buys in with **one chip**.
- Every time you lose a round, you **fold a corner of your chip**.
- When you fold the **fourth corner** you are **"on the bus"** — one more loss
  and you are out, and your chip goes into the pot.
- The **last player standing wins the pot**.

So each player effectively has five lives: four corners, then the bus.

> The game comes from playing with a real dollar bill: you buy in with a dollar
> and fold a corner of it each time you lose. Chips keep the same shape — four
> corners, then the bus — without real money changing hands. Chips are a score
> only. They cannot be bought, cashed out, or passed between players.

## Elimination

- A player who loses their **fifth** life (already on the bus) is **out**, and
  their chip goes into the pot.
- A knocker who loses owes **two folds**. If they don't have two corners left —
  or they're already on the bus — they are simply **out**. The debt doesn't
  carry anywhere.
- A **31** can eliminate several bus riders at once. If it clears the whole
  table, the player who hit 31 **wins the pot**.
- Nothing changes **head-to-head**. With two players left, the same knock,
  scoring and elimination rules apply.

## Edge cases

Settled on 2026-10-02 so the engine has one answer for each. These are rules,
not implementation details.

| Case | Ruling |
| --- | --- |
| **Dealt 31** | The round ends immediately after the deal, as an instant 31. |
| **Two players hold 31 at once** (different suits) | Both are safe; everyone else folds a corner. If that leaves no one else, the round is replayed. |
| **31 during the final round after a knock** | A normal 31: every other player folds one. No knocker penalty applies. |
| **K-A-2 suited** | Not a straight. The Ace is high *or* low, never both. |
| **Taking the discard and throwing the same card straight back** | Allowed. Any of the four cards may be discarded. *(Was "not allowed" until 2026-10-11; reversed after play-testing — a mis-tap on the discard pile became unrecoverable.)* |
| **First dealer** | Chosen at random. After that the deal moves left, skipping eliminated seats. |
| **Knocker with one corner left loses** | Out. The two-fold penalty is not capped at the bus. |
| **Every remaining player is eliminated at once** (e.g. the last two are both on the bus and tie) | The round is replayed and nobody goes out. |

## In the app

The app follows these rules, with three additions that only make sense online:

- **Turn timer.** Every turn is capped at **30 seconds**. Letting it run out
  removes you from the game.
- **Leaving mid-game.** A player who is timed out or quits **forfeits their
  chip to the pot** and is out; their remaining corners count for nothing.
  Their hand is set aside and **the round carries on without them** — the turn
  passes to the next seat and a knock in progress stands. If the knocker is the
  one who left, the final round still completes and the lowest remaining hand
  folds one corner; there is no knocker penalty to apply. The hand is never
  re-dealt, so leaving cannot rescue a losing round.
- **A table left with one player.** If everyone else is timed out or quits, the
  game ends with **no winner** and the pot is lost, including the last player's
  own chip. A game only pays out when it is played to a finish.
