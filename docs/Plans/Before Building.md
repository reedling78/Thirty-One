# ThirtyOne — Before Building

> **Superseded on 2026-10-02.** This page is the record of what was missing before a plan existed. [[Implementation Plan]] is the current plan and [[Project Review]] holds the corrections; where this page disagrees with either, they win.

## Scope

This page answers one question: what was still missing before an implementation plan could be written. [[App Features]] says what the app does, [[Tech Stack]] says what builds it, [[Rules]] says how the game plays. None of them says **what gets built, in what order, against what shapes** — these are the gaps that would have stalled or caused rework.

Several of these are now closed. [[Scope]] holds the slices and the launch target; [[Design Plan]] holds the design method. This page stays as the record of what was identified and where each piece went.

## The gaps

Ordered by whether they can invalidate a decision already made.

### 1. The two spikes from [[Tech Stack]] — still open

[[Tech Stack]] names these itself and says they come before anything is built on top. Each has a named fallback that changes the stack.

| Spike | Question it answers | If it fails |
| --- | --- | --- |
| Hidden hands in Colyseus | Can a player's three cards reach only them? | Keep hands out of synced state — room memory, pushed per player |
| Apple sign-in in Expo + Supabase Auth | Does the Apple flow work, private-relay email included? | Firebase Auth + Neon Postgres, with a hand-rolled deletion job |

The Apple spike moves the most: it decides Auth *and* Database as a bundle.

**Note the tension with the launch target.** A practice build exercises neither spike — practice has no auth and no Colyseus room. They de-risk slice 2 rather than unblocking slice 1, so they run **parallel** to the practice build, not in front of it.

### 2. Launch scope — closed, see [[Scope]]

[[App Features]] describes the finished app, not a first release. Resolved on 2026-10-01: four slices, with a practice-only build as the first target. [[Scope]] holds the detail and the explicit out-of-scope list.

### 3. The data model — deferred to slice 2

Not needed for a practice build, which has no persistence at all. It remains the largest missing artefact for slice 2, and the Apple spike above is what settles the database it gets drawn against.

[[Tech Stack]] decides Postgres on Supabase and names the entities in passing — users, profiles, chips won, friends, blocks, groups, schedules, chat, reports — but no note defines a table or column. Specifics that several existing decisions depend on:

- **Friends and blocks are directed one-sided edges.** [[App Features]]: adding is one-sided like following, blocking is one-sided and silent. Two edge tables, not symmetric pairs.
- **Account deletion decided the whole Auth + Database bundle.** The `ON DELETE CASCADE` paths from `auth.users` are what that choice was bought for, so they need writing down to be verified.
- **Reports outlive their channel by 90 days**, so a report stores a *copy* of the message, not a foreign key to it.
- **Unread counts** need a per-channel `last_read_at` per player — [[Tech Stack]] calls this the fiddliest part.
- **Chips won** is a running total credited at game end. Decide whether it is a denormalised column or derived from a games table; the leaderboard is an `ORDER BY` either way.

A companion decision: what the game server persists at game end — a games row, the winner, the pot — versus what dies with the Colyseus room.

### 4. Table screen design — method closed, see [[Design Plan]]

A practice build *is* the table screen, so this gates the only slice that matters. [[App Features]] puts a condition on its own number: *"Ten is the working number, and the table screen has to earn it… If the design cannot carry ten comfortably, this number comes down."* The cap is a design output, not a given.

The four accessibility commitments shape this screen rather than following it, so they belong in the design pass, not a later audit.

[[Design Plan]] holds the method. [[Design]] will hold the findings.

### 5. The three open questions — only one touches slice 1

| Question | From | Bearing on a practice build |
| --- | --- | --- |
| Should hosts be able to switch quick-play seating off? | [[App Features]] | None — but cheap now, awkward after the join flow exists |
| Does the game server also serve chat and presence? | [[Tech Stack]] | None. Slice 3 |
| How many concurrent tables must launch carry? | [[Tech Stack]] | None. Slice 2, and it decides whether one Fly node suffices |

All three defer safely. Listed so they are not mistaken for blockers.

### 6. Non-code prerequisites — one exception

A practice build defers nearly all of this:

- **Privacy policy and terms** — ~~deferred~~ **needed before slice 1 ships publicly.** Corrected 2026-10-02: both stores require a policy regardless of data collected, and Sentry crash reports are collected data. See [[Scope]].
- **Support contact and operator view** — deferred with support chat, slice 3.
- **Google Play account** — deferred. $25 one-time, no lead time worth pre-empting.
- **Apple Developer account — the exception.** Needed to run a build on a physical device, takes days to enrol, and is the prerequisite for the Apple sign-in spike. Start regardless of everything else.
- **App name and bundle identifiers.** Settle before they are baked into two stores.

## Where each gap went

| Gap | Status |
| --- | --- |
| Two spikes | Open — run parallel to slice 1 |
| Launch scope | Closed — [[Scope]] |
| Data model | Deferred to slice 2 |
| Table screen design | Method rewritten in [[Design Plan]] on 2026-10-02 (greybox first, design lives in the repo); findings pending in [[Design]] |
| Three open questions | Deferred, none blocking |
| Apple Developer enrolment | Open — start now, it is waiting rather than working |

## Verification

**The practice build (slice 1) is done when:**

- `vitest` passes on the rules package with every row of [[Rules]]' example-hands table as a case — the suited Q-K-A at 31, the Ace-low straight at 30, the no-shared-suit hand at 10
- Corners, the bus, the knocker's two-corner penalty, and a 31 clearing several bus riders are covered by tests, not just hand scoring
- The app launches signed out to a practice table, and a full game plays to a winner against computer opponents
- The rules package imports nothing from Colyseus or any transport — grep to confirm, since this is what makes slice 2's server cheap
- The table screen stays legible at the largest system text size, and suits are distinguishable with colour removed
- The guided first game walks a new player through a turn

**The spikes are done when:** each has a written outcome, and [[Tech Stack]]'s "Spikes — prove these first" section says so — either confirming the logged decision or adopting the fallback in its decision log.

## Decision log

| Date | Decision | Why |
| --- | --- | --- |
| 2026-10-01 | Spikes run parallel to slice 1, not before it | A practice build exercises neither. They de-risk slice 2, so gating the first build on them buys nothing. |
| 2026-10-01 | Apple Developer enrolment starts first | Days of lead time, and it gates both device builds and the Apple spike. It is waiting, not working. |
| 2026-10-01 | Rules engine leads the build | The only part of slice 1 depending on no open question and no design, and the longest pole. |
