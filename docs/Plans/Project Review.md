# ThirtyOne — Project Review (2026-10-02)

## Scope

A whole-project pass over [[Rules]], [[App Features]], [[Tech Stack]], [[Scope]], [[Before Building]], [[Design Plan]] and [[Implementation Plan]], looking for errors in the research, contradictions between notes, gaps, and what to do next. Each finding names the note it lands in. Nothing here is applied yet — the fixes are proposals until they are written into the notes they belong to.

## Summary

The research is in good shape. The stack decisions are reasoned and logged, the slice cut is right, and the implementation plan's four ground rules (pure engine, `TableClient`, `viewFor`, injected RNG) are the best decisions in the vault — they make slice 2 cheap and the hidden-hands spike almost trivial. The problems are smaller: one wrong claim in [[Scope]] about the privacy policy, one rule in [[Rules]] that creates an exploit, a handful of engine edge cases the rules do not cover, a design note that was rejected but still reads as current, and copies of the docs living in two places.

## Findings

### 1. The privacy-policy claim in [[Scope]] is wrong — fix before any public build

[[Scope]] and [[Before Building]] say a signed-out practice app collects nothing, so no privacy policy is needed yet. Two things break that:

- **Apple requires a privacy policy URL for every app** submitted to the App Store (Review Guideline 5.1.1), whether or not it collects data. Google Play requires one in the Data Safety form as well.
- **Sentry is wired in at Milestone 7** of [[Implementation Plan]]. Crash reports carry device identifiers and are "data collected" in both stores' definitions, so the nutrition label and data-safety form have to declare them.

This does not block TestFlight internal testing, but it blocks the first public slice 1 release. It is an afternoon of work, not a project — just move it from "deferred to slice 3" to "before slice 1 ships publicly". The same correction belongs in [[Before Building]] §6.

### 2. The forfeit rule re-deals the hand — that is an exploit

[[Rules]] ("In the app") and [[App Features]] ("Turn timer") both say that when a player times out or quits, the hand in progress is collected and **re-dealt**. Consider a knocked round: the knocker is sitting on 27, the player on the bus is holding 9 and about to go out. The bus rider quits. They lose their chip either way — but the re-deal **erases the knock and rescues every other low hand at the table**. A player with nothing left to lose can reset the round for everyone, and in a group of friends that will be discovered in the first week.

Proposed fix: on forfeit, **remove the leaver's hand from the round and carry on**. The leaver's cards go to the bottom of the draw pile (or are set aside), turn passes to the next seat, and a knock in progress stands. If the leaver was the knocker, the final round still completes and the lowest remaining hand folds (no knocker penalty, since the knocker is gone). Re-deal only if the forfeit leaves fewer than two players, which is already the "no winner" case. This is also simpler for the engine: `forfeit(state, seat)` becomes "mark out, drop hand, advance turn" with no new round.

Lands in: [[Rules]] "In the app", [[App Features]] "Turn timer", and [[Implementation Plan]] 2d (`forfeit`).

### 3. Engine edge cases the rules do not answer

[[Implementation Plan]] has a good edge-case table under "Rules questions to settle before Milestone 2c". These are missing from it:

| Case | Proposed default |
| --- | --- |
| **When does 31 trigger?** After a draw you hold four cards | Only on a three-card hand: after the deal and after each discard. Three of your four cards making 31 is not yet 31 — you discard, then it is |
| **Two players dealt 31 at once** (different suits) | Both are safe; everyone else folds one. If that leaves no one else, the round is replayed |
| **K-A-2 "wraparound" straight** | Not a straight. Ace is high *or* low, never both |
| **Who deals round one** | Random seat (seeded). After that, left past eliminated seats, as planned |
| **Does the app auto-declare 31?** | Yes. There is no reason to hide it and it removes a UI decision |
| **Forfeit during a knocked round** | See finding 2 — round continues |
| **Knocker folds two but is on 3 folds** | Out, per [[Rules]]. [[Implementation Plan]] already asks to confirm; recommend confirming as intended — a failed knock from the bus stop should hurt |

Once decided, these belong **in [[Rules]] itself**, not just the plan, since [[Rules]] is what the engine's test suite is written from. A rule that only exists in the implementation plan will drift.

### 4. Ten seats is a deck question, not only a screen question

[[App Features]] makes the ten-seat cap conditional on the table screen. There is a second constraint nobody has written down: a 52-card deck. At ten seats the deal uses 30 cards plus one discard, leaving **21 in the draw pile — about two turns each** before the discard pile has to be reshuffled. At eight seats it is 27 cards, roughly three each. The game works either way (the reshuffle is defined), but at ten the reshuffle is routine rather than rare, and every reshuffle wipes out the discard-tracking that [[Rules]] calls "part of the game".

This is not a reason to drop to eight now. It is a reason to **measure it**: the bot simulation harness in Milestone 3 should report reshuffles per round at 2, 6, 8 and 10 seats. If ten seats reshuffles in most rounds, that is an argument for a lower cap that no amount of screen design will surface.

Lands in: [[Implementation Plan]] Milestone 3, and the open question in [[Scope]].

### 5. [[Design Plan]] was rejected but still reads as the plan

The Copilot conversation of 2026-10-01 rejected the Cowork / transit-tracker ingest setup, and [[Implementation Plan]] records the design method as open. But [[Design Plan]] still presents that setup as decided, and [[Before Building]] §4 still says "method closed, see [[Design Plan]]". A reader of the vault would follow the wrong plan.

Two parts of [[Design Plan]] are still right and worth keeping: the **brief constraints** (ten seats, the four accessibility commitments, what a seat and the table show, 2/6/10-seat layouts) and the **two boundaries** (never pick a replacement hue for a failing contrast pair; never edit a token to make a check pass). The Cowork structure, the copied skill, and the `design-diff` sections should go.

Proposed answer to the open question: **the design system lives in the code repo**, at `apps/mobile/src/theme/`, because the Expo app is its only consumer. The vault holds the brief and the decisions ([[Design]], once it exists); the repo holds the tokens and components, versioned by git like everything else. Claude Design cannot see either place, so the brief is self-contained regardless. The greybox table in Milestone 4 comes first and is what the design is checked against — [[Implementation Plan]] already says so.

Recommend rewriting [[Design Plan]] down to: where the design lives, the brief, the two boundaries, and a build order of greybox → brief → design → tokens into the repo → [[Design]].

### 6. Doc drift

- **The Claude project holds copies of [[Rules]] and [[App Features]]** (`claude/rules.md`, `claude/app-features.md`), and the App Features copy still has General chat, which the vault dropped on 2026-09-26. Two sources of truth will keep diverging. The vault is canonical; the project copies should go, or be replaced by a one-line pointer.
- **[[Tech Stack]] open question "does the game server also serve chat and presence?"** is already answered by its own Chat decision ("build on the game server's socket") and Redis decision (presence in Upstash). Close it.
- **[[Tech Stack]] open question "how many concurrent tables?"** can be closed with an assumption: one small Fly machine carries hundreds of tables of this size (state per table is a few KB and writes are one per turn). Record "one node until measured otherwise".
- **[[Before Building]] §2 and §4** point at closed items that have since reopened or moved. It is a historical record by its own description; add a line at the top saying [[Implementation Plan]] supersedes it.
- **`[[Design]]`** is linked from four notes and does not exist. Fine as a placeholder, but say so where it is first linked.
- **The `ThrityOne` spelling** is still open and is now in the memory of two tools and this folder's path. Decide the bundle identifier (`com.<you>.thirtyone`) and either rename the folder or accept the misspelling as the vault's name only.

### 7. Smaller notes

- **"Your turn" push notification** ([[App Features]]) is of little use against a 30-second timer — by the time a backgrounded player taps it and the socket reconnects, most of the turn is gone. Keep it, but do not design around it; the 60-second hold is what actually saves that player. Slice 3 concern.
- **Expo Go** covers Milestones 1–3 and most of 4 (Reanimated and Gesture Handler ship in it). Sentry and `expo-apple-authentication` need a development build, which is why the first EAS build sits where it does. Good — just do not let it slip earlier than needed.
- **The vault carries clutter** — `.copilot/model-catalog-cache.json` is 5 MB and `copilot/copilot-conversations/` holds working logs. If the vault is ever put in git, ignore both.
- **Card artwork** will need to be original or openly licensed. Worth one line in the design brief so Claude Design produces faces rather than referencing a known deck.

## What is missing entirely

Nothing large for slice 1. The vault has rules, features, stack, scope, and a task-level plan. Deferred correctly to slice 2: the data model, the Colyseus room design, the Live Game Room listing shape. Deferred correctly to slice 3: the support operator view, the moderation word list, the privacy policy *contents* (though the policy itself moves forward — finding 1).

Two things worth adding before build starts, both short:

- **[[Design]]** — even as a stub holding the decided seat cap once Milestone 4 answers it, so the four notes that link to it resolve.
- **The edge-case decisions written into [[Rules]]** (finding 3), so the engine's tests have one source.

## Next steps, in order

1. **Decide the name and bundle identifier.** Five minutes, and it unblocks Apple enrolment, EAS, and the folder question.
2. **Start Apple Developer enrolment.** Waiting, not working — start today.
3. **Settle the rules edge cases** (finding 3 plus the forfeit change in finding 2) and write them into [[Rules]]. This is the only thinking that gates Milestone 2.
4. **Fix the doc drift** (findings 1, 5, 6): correct the privacy-policy line, rewrite [[Design Plan]], close the two [[Tech Stack]] questions, mark [[Before Building]] superseded, remove the project copies.
5. **Step 0 and Milestone 1** from [[Implementation Plan]]: repo reset, pnpm skeleton, CI with the purity check. The commands for Step 0 are already written there.
6. **Milestone 2a** — cards and scoring, test-first from the example-hands table.

Steps 1–4 are a day of writing. Step 5 is the first code.

## Decision log

| Date | Decision | Why |
| --- | --- | --- |
| 2026-10-02 | Review written | Findings were proposals until applied |
| 2026-10-02 | Every open question closed and applied to the notes | Name and bundle ID, forfeit, edge cases, design location, practice seats, launch scale, quick play. See each note's decision log. Project copies of the docs deleted; the vault is canonical. |
