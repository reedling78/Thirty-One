# ThirtyOne — Implementation Plan

## Scope

This page turns [[Scope]], [[Tech Stack]] and [[Before Building]] into build steps. **Slice 1 (Practice)** is planned to the task level. Slices 2–4 are outlined at milestone level only, since they would drift before they are built.

The existing `reedling78/Thirty-One` repo is being rebooted. The old code is archived, not migrated, and nothing in it constrains this plan.

## Ground rules

These hold in every slice and come from decisions already logged in [[Tech Stack]].

- **The rules engine is pure.** `packages/rules` has zero runtime dependencies and imports nothing from React, Expo, Colyseus or any transport. CI enforces this.
- **The UI talks to a `TableClient`, never to the engine directly.** Practice uses a `LocalTableClient` that runs the engine and bots on the device. In slice 2 a `ColyseusTableClient` implements the same interface. That makes the table screen the same code in both modes.
- **Players only ever see a view.** The engine exposes `viewFor(state, seat)`, which returns your own hand plus public state. Bots play from views too, so they can't cheat, and the slice 2 hidden-hands spike shrinks to "send each client its view".
- **Randomness is injected.** The engine takes a seeded RNG, so every game is reproducible in tests and replayable from a bug report.
- **Test-first on rules.** Every row of [[Rules]]' example-hands table becomes a test case before the scorer exists.

## Repo layout

pnpm workspaces, one repo. No Turborepo until build times justify it.

```
Thirty-One/
  apps/
    mobile/            Expo app (Expo Router, TypeScript strict)
    server/            slice 2 — Colyseus game server (not created in slice 1)
  packages/
    rules/             @thirtyone/rules — engine: cards, scoring, state, reducer, views
    bots/              @thirtyone/bots — computer opponents, consume views only
    tsconfig/          shared tsconfig bases
  .github/workflows/   ci.yml
  .nvmrc               Node LTS
  pnpm-workspace.yaml
  .npmrc               node-linker=hoisted (Expo monorepo compatibility)
```

Design tokens land in `apps/mobile/src/theme/` when the design exists. They move to a `packages/ui` only if a second app ever needs them.

## Step 0 — Repo reset

Archive the old code on a branch and a tag, then replace `main` with a clean tree in one commit. Run these yourself, since they need your GitHub credentials.

```bash
cd /Users/reedrizzo/Documents/Github/Thirty-One
git status                                  # must be clean; commit or stash anything you want kept
git fetch origin --prune
git switch main                             # use the repo's default branch if it isn't main
git pull --ff-only

# Archive
git branch legacy/v0
git tag -a legacy-v0 -m "Snapshot before the 2026-10 reboot"
git push origin legacy/v0
git push origin legacy-v0

# Clean main
git rm -r -q .
git status --ignored                        # review: ignored leftovers (node_modules, .env, builds) are still on disk
rm -rf node_modules                         # plus any other ignored build output listed above; keep anything you need, like .env
git commit -m "Reboot: remove legacy code (archived on legacy/v0)"
git push origin main
```

The skeleton (Milestone 1) goes on top of this as the next commit.

## Slice 1 — Practice

The goal is a signed-out app that opens on a practice table and plays a full game of Thirty-One to a winner against computer opponents, with the guided first game, the rules screen, and accessibility and sound settings. It needs no server, no accounts and no chips.

### Milestone 0 — Prerequisites (waiting, not working)

| Task | Why now |
| --- | --- |
| ~~Apple Developer enrolment~~ **Done — account already active (confirmed 2026-10-03)** | Needed for device builds and the Apple sign-in spike |
| ~~Settle app name and bundle identifiers~~ **Decided 2026-10-02: app name `ThirtyOne`, bundle identifier `com.reedrizzo.thirtyone`, vault folder renamed `ThirtyOne` on 2026-10-03** | They get baked into EAS, both stores, and the design export. Also settles the `ThrityOne` / `Thirty-One` / `ThirtyOne` spelling |
| ~~Expo account~~ **Done — account exists (confirmed 2026-10-03).** `eas login` on this machine before Milestone 4 | Needed for development builds in Milestone 4 |

### Milestone 1 — Skeleton and CI

1. Root: `package.json` (private, `packageManager` pinned), `pnpm-workspace.yaml`, `.npmrc`, `.nvmrc`, `.gitignore`, `.editorconfig`, README.
2. `packages/tsconfig`: strict base, with `noUncheckedIndexedAccess` on.
3. `packages/rules` and `packages/bots`: empty packages with Vitest wired up and one passing placeholder test each.
4. `apps/mobile`: `create-expo-app` (current SDK, Expo Router template), switched to TypeScript strict, building against the workspace packages.
5. Lint and format: ESLint flat config (`eslint-config-expo` in the app) and Prettier.
6. `.github/workflows/ci.yml` on push and PR: install, typecheck, lint, `vitest run`, plus a **purity check** that fails if `packages/rules` has any `dependencies` or imports outside itself.

**Done when** CI is green on `main`, and `pnpm -F mobile start` opens the app in Expo Go or the simulator.

> **Done 2026-10-03.** Commit `7abcebd` on `main`. Two things learned: pnpm 12 reads its settings from `pnpm-workspace.yaml`, not `.npmrc` (so `nodeLinker: hoisted` lives there), and `pnpm ci` is a reserved pnpm command — the all-in-one script is `pnpm check`. `expo-env.d.ts` is committed so `tsc --noEmit` works in CI. Verified on the iPhone 16 Plus simulator.

### Milestone 2 — Rules engine, test-first

The longest pole. Built in this order, writing each layer's tests before its code.

**2a. Cards and scoring**

- `Card`, `Suit`, `Rank`, deck construction, and a seeded shuffle (Fisher–Yates over an injected RNG).
- `scoreHand(cards) → { total, kind, suit }`, where `kind` is `suited | trips | straight | thirtyOne`, always taking the best reading.
- Tests: every row of [[Rules]]' example table. Also the suited Q-K-A scoring 31 not 30, A-2-3 suited scoring 30 not 16, the no-shared-suit hand, trips of aces (30, not 33), and a Q-K-A that isn't suited.

> **2a done 2026-10-03.** `cards.ts` (types, deck, values, `parseCard` fixtures), `rng.ts` (SplitMix32 as a serialisable uint32 state, Fisher–Yates `shuffle`), `scoring.ts` (`scoreHand`, `isStraight`, `isTrips`, `findThirtyOne` / `hasThirtyOne` over any number of cards for the four-card case). 34 tests including fast-check properties. One rule the tests forced: when two suits tie for the best total, the carrying suit breaks on `SUITS` order so a score never depends on card order.

**2b. Game state and turn flow**

- `GameState`: seats (id, hand, folds 0–4, out), draw pile, discard pile, dealer, turn, phase, knocker, final-round turns remaining, and RNG state.
- `apply(state, action) → { state, events }` as a pure reducer. Actions are `draw(source)`, `discard(card)` and `knock`. Illegal actions return a typed error and never throw.
- Events (`dealt`, `drew`, `discarded`, `knocked`, `revealed`, `folded`, `eliminated`, `roundWon31`, `gameWon`) are what the UI animates and, later, what the server broadcasts.
- Draw pile exhaustion: reshuffle the discard pile, keeping its top card in place.

> **2b done 2026-10-08.** `game.ts` (`GameState`, `createGame`, `startRound` with an optional scripted deck for tests and the guided first game, `endRound` with the reveal, event union) and `turn.ts` (`apply`, `legalActions`, typed `ActionError`s). 55 tests. Scripted-deck helper lives in `test/helpers.ts`. Working note: `node_modules` is platform-specific, so engine work is iterated in Claude's workspace and written back, not run through the mounted folder.

**2c. Knock, round resolution, elimination**

- Knock: everyone else gets one more turn, no second knock is allowed, and hands are revealed when play returns to the knocker.
- Lowest folds one corner. Ties all fold. A losing knocker folds two, and is out if they can't cover two folds.
- An instant 31 makes every other player fold, and can eliminate several bus riders at once. If it clears the whole table, the hitter wins.
- Folds 0–4, where 4 means "on the bus". A loss while on the bus means out.
- Next round: the dealer moves left past eliminated seats, and the game ends when one player remains.

> **2c done 2026-10-08.** `round.ts`: `resolveRound` (lowest folds one, ties all fold, losing knocker folds two, 31 folds everyone else, bus and elimination, everyone-out replay, dealer rotation, `gameWon`) and `forfeit` (cards to the bottom of the draw pile, round carries on, knock stands, knocker penalty waived if the knocker left, one player left → `gameAbandoned` with no winner). Phases are now `lobby → playing → roundOver → betweenRounds → … → gameOver`, and the knock tracks an explicit `pendingAfterKnock` list of seats owed a turn. 77 tests, including whole games under random play ending with exactly one winner, and same-seed-same-game.

**2d. Views and invariants**

- `viewFor(state, seat)`: your own hand, every seat's card count and folds, the discard top, the turn, and the phase. Other hands appear only after the reveal.
- `forfeit(state, seat)` exists now, unused in slice 1, so slice 2's timeouts and quits are an engine call: the seat is marked out, its hand is set aside, the turn advances, and a knock in progress stands (if the knocker left, the final round completes with no knocker penalty). The hand is never re-dealt. A table left with one player ends with no winner.
- Property tests (fast-check):
  - 52 cards are always conserved.
  - No view ever contains another seat's hidden card before the reveal.
  - Random legal play always terminates with exactly one winner.
  - The same seed always produces the same game.

**Done when** coverage on `packages/rules` is near 100% and every rule in [[Rules]] maps to at least one named test.

> **2d done 2026-10-08 — Milestone 2 complete.** `view.ts`: `viewFor` (own hand and best-three score, everyone's counts/folds/bus/turn/knocker/dealer, discard top, pile counts, legal actions, the reveal once the round is over) and `redactEvent` (the only private event is another seat's face-down draw). `bestScore` added to scoring for the four-card hand value. Coverage: 100% lines and functions, 98% statements (`pnpm -F @thirtyone/rules test:coverage`). 87 tests. Hidden-hands property: across random play at 2–10 seats, no view or redacted event ever shows a viewer another seat's dealt or deck-drawn card before the reveal — which is exactly the slice 2 server guarantee.

### Milestone 3 — Computer opponents

- `packages/bots` takes a `PlayerView` and returns an `Action`. It never sees `GameState`.
- **Normal** bot:
  - Draws from the discard pile if that improves its best total.
  - Discards the card whose removal costs the least.
  - Knocks when its total clears a threshold that rises with the number of players still in and falls as the round goes on.
- **Easy** bot: the same logic with deliberate noise, so a new player can win.
- Personalities are just different thresholds, which makes them cheap to vary.
- Simulation harness (CLI script in `packages/bots`): run 10,000 seeded bot-vs-bot games and report average game length, knock success rate and win spread. Tune the thresholds from this, not by feel.
- The harness also reports **draw-pile reshuffles per round at 2, 4, 6, 8 and 10 seats**. A 52-card deck leaves 21 draw cards at ten seats — about two turns each — so this is the deck-side evidence for the seat cap, alongside the screen-side evidence from Milestone 5.

> **Milestone 3 done 2026-10-08.** `packages/bots`: `makeBot(personality)` with `NORMAL` and `EASY`; `bestDiscard`, `discardImproves`, `knockThreshold` (= base − 0.5·(players−2) − 1·laps, capped at 30 — it *falls* with more players, since the lowest hand loses, and falls per lap so every round ends). Noise on the easy bot only perturbs draws and discards, never knocks. `simulate` / `playGame` harness and `pnpm -F @thirtyone/bots simulate [games] [seed]`. 15 tests. Baseline at 500 games (normal vs normal): rounds last 7 turns head-to-head to 17 at ten seats, knocks succeed ~90%, a 31 every 7–18 rounds, easy wins 16% of four-seat games against normal. **Seat-cap evidence: reshuffles per round are ≈0 at every size, 0.02 at ten seats** — rounds end long before the 21-card draw pile does. The deck does not constrain the cap; only the screen does.

### Milestone 4 — Mobile shell and a playable greybox table

- `TableClient` interface: `subscribe(view => …)`, `send(action)`, and an event stream for animations.
- `LocalTableClient` runs the engine and schedules bot turns with a short, human-feeling delay.
- Routes:
  - `/`: the signed-out home, which lands on a practice table per [[App Features]]
  - `/practice`: the table. Practice is a **fixed four-seat table** (three bots); no setup screen. The engine and bots stay seat-count-agnostic.
  - `/rules`
  - `/settings`
- **Greybox table:** plain rectangles and system text, fully playable at four seats, with a **developer-only seat override** (hidden setting or env flag) that lays it out for 2 to 10 seats so the cap can be tested on a real phone. This is where the design gets tested against real play, not where it gets styled.
- Hand value is always shown, with the suit carrying it.
- Results screen at game end: the winner and the order players went out. No chips.
- Install Reanimated and Gesture Handler now. Card motion is a later pass.
- **First EAS development build on a physical iPhone and Android device.**

**Done when** a full game plays to a winner on a real device.

> **Milestone 4 code done 2026-10-08; device build pending.** `TableClient` interface, `LocalTableClient` (engine + bots on-device, paced by timers: 700 ms bot think, 2.5 s reveal, 0.9 s deal), `useTable` hook with an event log in plain words, routes `/`, `/practice`, `/rules` (reads engine constants), `/settings` (dev-only 2–10 seat override). Greybox table: face-down rectangles for opponents, tap deck or discard to draw, tap a card to discard (the just-taken discard is disabled), Knock button, hand value with carrying suit always shown, results screen with finishing order and Play again. Every card, seat, pile and button carries an accessibility label. Driven end to end headlessly with a bot as the human: full game, no illegal moves. Template demo screens and components removed. Still to do for the milestone's done-line: play it on a real device via an EAS development build.
>
> **Device build done 2026-10-12.** First EAS builds from the `design/tokens` branch: a `development` build (dev client, loads JS from Metro) and a `preview` build (JS bundled, runs standalone) on Reed's iPhone via ad hoc distribution. Two snags, both fixed: pnpm 12 wrote a literal placeholder (`esbuild: set this to true or false`) into `allowBuilds` in `pnpm-workspace.yaml` when `expo-dev-client` was added, which failed both the local install and EAS's install phase — set to `esbuild: true`; and App Store Connect flagged an updated Program License Agreement plus the EU trader-status question — neither blocks internal builds, both must be accepted before Milestone 7's TestFlight submission. `eas.json` profiles: `development`, `development-simulator`, `preview`, `production` (remote version source, auto-increment). First impression on the phone: feels good. Milestone 4 done-line met.

### Milestone 5 — Design system and the real table screen

Depends on the design pass. **Decided 2026-10-02:** the design system lives in the repo at `apps/mobile/src/theme/`, the brief is written from the vault after the greybox exists, and [[Design Plan]] holds the method. Whatever the method, the inputs are the constraints already listed in [[Design Plan]]: 2, 6 and 10 seats, the four accessibility commitments, card face and back, the seat component, and the hand value display.

- Bring in tokens (colour, type, spacing, radius) as `apps/mobile/src/theme/tokens.ts`.
- Build the card component with suits that work without colour: a distinct symbol and shape, checked in greyscale.
- Build the seat component: name, avatar placeholder, corner and bus indicator, active-turn marker. Leave a slot for the slice 2 disconnect marker.
- Lay out the table at 2, 6 and 10 seats on the smallest supported phone at the largest system text size.
- **Decide the seat cap** and record it in [[Scope]] and [[App Features]].
- Card motion: deal, draw, discard and reveal on Reanimated. Skia only if the table genuinely needs it.

> **Milestone 5 done 2026-10-12 (pending device check).** Design settled on the Claude Design canvas on 2026-10-11 ([[Design]] holds the decisions, [[Card Spec]] the card component). Brought into the repo as six commits the same day — theme and fonts (Bricolage Grotesque / Atkinson Hyperlegible via `@expo-google-fonts`), card faces and lattice backs with a Card back setting (`react-native-svg`), chip / KNOCKED pill / dealer disc / action island, the table, row callouts, and the secondary screens plus the guide overlay — followed by an iOS fix for the felt's light pool rendering solid white and, on 2026-10-12, dropping the court figures in favour of one large centre pip. Tokens live at `apps/mobile/src/theme/tokens.ts` with `cardArt.ts`, `components.ts`, `fonts.ts` and `text.tsx` beside it; the vault copies under `Design/` are reference only. Card motion on Reanimated is not yet done — entrance animations only, all skipped under reduce motion. **Seat cap is not decided here**: per [[Scope]] it is decided in slice 2; the design's position is that the opponent list scrolls internally from about seven seats. Still to do for the done-line: contrast and greyscale checks recorded in [[Design]], and the 2/6/10-seat layout checked on a real phone at the largest text size — both wait on the first EAS development build.

### Milestone 6 — Guided first game, rules screen, settings

- **Guided first game:** a scripted seed, so the deal is known, plus a step-by-step overlay:
  1. What you can draw
  2. What your hand is worth
  3. When knocking is worth it
  4. Corners and the bus

  It runs once, can be replayed from settings, and can be skipped.
- **Rules screen:** card values, scoring with the example hands rendered as real cards, knocking, corners and the bus. It reads from the same constants as the engine, so it can't drift.
- **Settings:** sound on/off, haptics, and reduced motion (respecting the OS setting). Stored locally with AsyncStorage.
- **Sound:** `expo-audio` for deal, draw, knock and fold.

> **Milestone 6 done 2026-10-11 (pending device check).** Settings persist in AsyncStorage (`SettingsProvider`: sound, haptics, reduce motion, guided-done) and the OS reduce-motion setting is honoured on top of the player's; all entrance animations skip when either is on. Rules screen rewritten with the seven example hands rendered as cards and scored by the engine at render time. Sounds are four synthesised WAVs (deal, draw, knock, fold) through `expo-audio`; haptics via `expo-haptics` on your turn, a knock, and a 31; all gated by settings. Guided first game: `scriptedDeck` promoted from a test helper into the engine; the player holds K♥ Q♥ 6♣ with the 9♥ on top of the deck, so one draw completes the hand and unlocks the knock. Six steps (draw, discard, watch the table, knock, reveal, done) key off the live view rather than a fixed sequence, so they survive the player taking the discard instead. "Learn to play" replaces "Play practice" on the home screen until the guide is done; replayable from Settings. Verified headlessly end to end. Still to do: hear the sounds and feel the haptics on a real phone (neither works in the simulator).

### Milestone 7 — Accessibility pass, verification, internal release

- VoiceOver and TalkBack can play a full game:
  - Every card says what it is ("Ace of spades").
  - Every seat announces its name, cards held and corners.
  - Turn changes are announced.
- Largest text size: nothing clips or overlaps at 10 seats (or whatever the cap ends up being).
- Greyscale check on suits.
- Sentry wired into the app (free tier) before anyone else touches a build.
- **Privacy policy and terms published** (a URL is required by both stores regardless of data collected, and Sentry is collected data). Needed before the public release, not before TestFlight internal testing.
- Internal TestFlight and Play internal-testing builds via EAS Submit.
- Run the slice 1 checklist from [[Before Building]] and tick it off there.

### Parallel to slice 1 — the two spikes

Neither blocks slice 1, and both can change a slice 2 decision. Run them in a throwaway `spikes/` branch, write up the outcome, and update [[Tech Stack]].

| Spike | Shape | Pass |
| --- | --- | --- |
| Hidden hands in Colyseus | Minimal Colyseus room holding `GameState` in plain memory, synced schema public-only, `viewFor` pushed per client via `client.send` | A second client never receives another player's hand, verified by logging raw frames |
| Apple sign-in, Expo + Supabase Auth | `expo-apple-authentication` → `signInWithIdToken`, on a real device, including "Hide My Email" | Session created; private-relay email stored; account delete cascades from `auth.users` |

## Slices 2–4 — outline

### Slice 2 — Multiplayer core

1. **Data model.** Write `Data Model.md` against whichever bundle the Apple spike confirms: users and profiles, games, results, and the chips-won strategy. Then Supabase migrations.
2. **Auth.**
   - Apple and Google sign-in.
   - Display name at first sign-in, with a synchronous moderation check.
   - Optional picture, screened with Vision SafeSearch.
   - In-app account deletion.
3. **Game server.**
   - `apps/server` is Colyseus wrapping `@thirtyone/rules`. One room per table.
   - 30s turn timer, `allowReconnection(60)`, 15-minute idle close.
   - Hosting on Fly.io with `min_machines_running = 1` and `SIGTERM` draining from day one.
4. **Live Game Room:**
   - Listings in Upstash Redis.
   - Join request, accept and deny.
   - Public and private tables.
   - Quick play, notify-me, and the empty-room states.
5. **Client.**
   - `ColyseusTableClient`. The table screen is unchanged.
   - Disconnect marker, results screen with chips, rematch, host hand-off.
6. **Done when** two phones play a full game, with a mid-game disconnect and rejoin.

### Slice 3 — Social

Store compliance starts here.

- Chat on the game-server socket, with messages in Supabase:
  - Table, DM and support channels
  - Unread counts via `last_read_at`
  - Cursor pagination
  - Rate limits
- Moderation: an in-process word list, then async OpenAI moderation.
- Safety controls:
  - Report, with message copies kept 90 days
  - Silent one-sided block
  - Filter
  - Support operator view
- Friends: one-sided follow, presence, and a friends-only leaderboard.
- Push via Expo Notifications, with per-category toggles and the permission prompt on first use.
- `pg_cron` purge jobs.
- Privacy policy and terms published before release.

### Slice 4 — Groups

- Groups: roster, group chat, invites, leave.
- Scheduled games on BullMQ delayed jobs: RSVPs, auto-open of a private table, held seats, notifications.

## Rules edge cases

Settled on 2026-10-02 and written into [[Rules]] under "Edge cases", which is the source the tests are written from. In short: a dealt 31 ends the round; 31 counts the moment any three cards in hand make it, four-card hand included, and the app declares it; two simultaneous 31s are both safe; a 31 in a knocked final round is a normal 31 with no knocker penalty; K-A-2 is not a straight; ~~the drawn discard cannot be thrown straight back~~ (reversed 2026-10-11: any of the four may be discarded); **a knock needs a complete hand — one suit or three of a kind (added 2026-10-09; `isCompleteHand`, error `knockNeedsCompleteHand`)**; the first dealer is random; a knocker on their last corner who loses is out; a round that would eliminate everyone is replayed.

## Open questions

None at present. All three earlier questions were closed on 2026-10-02 — see the decision log.

## Decision log

| Date | Decision | Why |
| --- | --- | --- |
| 2026-10-02 | Reboot the repo: archive on `legacy/v0` and the `legacy-v0` tag, clean `main` | Old code doesn't match the decided stack. Archiving keeps the history without carrying it forward |
| 2026-10-02 | pnpm workspaces monorepo: `apps/mobile`, `packages/rules`, `packages/bots`, later `apps/server` | One repo for the shared rules package and its two consumers. Turborepo deferred until build time justifies it |
| 2026-10-02 | UI depends on a `TableClient` interface; practice uses `LocalTableClient` | The table screen is the same code in slices 1 and 2. Only the client implementation changes |
| 2026-10-02 | The engine exposes `viewFor`, and bots consume views only | Fair bots, and the slice 2 hidden-hands problem becomes "send each client its view" |
| 2026-10-02 | Greybox table before design | The engine and a playable table don't wait on the open design-method question. The design gets tested against real play |
| 2026-10-02 | App name `ThirtyOne`, bundle ID `com.reedrizzo.thirtyone` | One word, matches the notes. Vault folder to be renamed to match |
| 2026-10-02 | Forfeit carries the round on; never re-deals | Re-dealing let a player with nothing to lose reset a knocked round. Simpler engine too |
| 2026-10-02 | Rules edge cases settled and moved into [[Rules]] | One source for the test suite |
| 2026-10-02 | Design system lives in the repo at `apps/mobile/src/theme/`, built after the greybox | The Expo app is its only consumer; the greybox is what the design is checked against |
| 2026-10-02 | Practice is a fixed four-seat table; greybox gets a dev-only seat override | Easier first screen without losing the ability to test ten seats on a phone |
| 2026-10-02 | Bot harness reports reshuffles per round by seat count | The deck, not just the screen, constrains the cap |
| 2026-10-02 | Privacy policy before the public slice 1 release | Required by both stores regardless; Sentry is collected data |
