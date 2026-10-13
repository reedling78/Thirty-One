# ThirtyOne — Scope

## Scope

This page says what gets built and in what order. [[App Features]] describes the finished app and [[Tech Stack]] picks what builds it; neither says which parts ship first. That is this page.

The app is cut into four slices. Each is releasable on its own, and each defers a set of obligations that the next one takes on. The first target is slice 1.

## The slices

| Slice | What is in it | Needs a server |
| --- | --- | --- |
| **1 — Practice** | Rules engine, table screen, computer opponents, guided first game, rules screen | No |
| **2 — Multiplayer core** | Auth, profile, Live Game Room, real tables, host controls, turn timer, disconnect hold | Yes |
| **3 — Social** | Chat, friends, blocks, reports, support, leaderboard, notifications | Yes |
| **4 — Groups** | Rosters, group chat, scheduled games | Yes |

The seam between 1 and 2 is the one that matters: [[App Features]] already requires practice mode to work signed out against computer opponents, so slice 1 is a complete app that happens to need no backend at all.

## First target: slice 1

**Decided 2026-10-01.** The first build is practice — the rules engine plus the table screen, on-device and signed out.

### What is in it

- The Thirty-One rules engine as a shared package: deal, score, draw, discard, knock, resolve, corners and the bus
- The table screen, playable against computer opponents
- The **guided first practice game** — [[App Features]] has the first practice game talk the player through a turn at a time: what they can draw, what their hand is worth, when knocking is worth it
- The **rules screen** — card values, knocking, corners and bus; [[App Features]] has it working signed out
- Accessibility and sound settings, which [[App Features]] also lists as working signed out

### What is explicitly out

Everything requiring another person or a server. Named here so the boundary is not re-argued:

| Out of slice 1 | Where it lands |
| --- | --- |
| Sign in, profile, display name, profile picture | 2 |
| Live Game Room, real tables, join requests, host controls | 2 |
| Turn timer, disconnect hold, crash recovery | 2 |
| Chips won, the pot, results screen, rematch | 2 |
| Chat of any kind, and all four safety controls | 3 |
| Friends, blocks, leaderboard, notifications | 3 |
| Groups, scheduled games | 4 |

### What slice 1 defers

Worth stating because it is most of the operational burden in the vault:

- **No accounts** means no deletion cascade — the requirement that decided the whole Auth + Database bundle in [[Tech Stack]].
- **No chat** means none of the four safety controls in [[App Features]], and none of the moderation stack.
- **Almost no collected data** — but *not* no privacy policy. Apple requires a privacy-policy URL for every App Store app regardless of what it collects, Google Play requires one in the Data Safety form, and Sentry crash reports count as collected data in both. A short policy is needed **before slice 1 ships publicly**; it does not block TestFlight internal testing. Corrected 2026-10-02.
- **No server** means Fly.io, Supabase, Upstash, `SIGTERM` draining, and `pg_cron` all sit untouched. The infrastructure floor is $0 rather than the ~$5 in [[Tech Stack]]'s launch table.

### What slice 1 still has to get right

Two things carry forward into every later slice, so they are worth doing properly the first time:

- **The rules engine must be transport-agnostic.** Pure functions over a state object, no knowledge of Colyseus or any socket. [[Tech Stack]] requires this because the same package runs in the authoritative server, and it is what makes the realtime-server decision cheap to reverse.
- **The table screen still has to earn the seat cap, but slice 1 tests it rather than deciding it.** Practice is a fixed four-seat table; the greybox carries a developer-only seat override so ten seats can be laid out on the smallest phone at the largest text size, and the bot simulator reports reshuffles per round at each size (a 52-card deck leaves only 21 draw cards at ten seats). The cap itself is decided in slice 2 with that evidence.
- **The table screen decides the seat cap.** (Superseded by the line above on 2026-10-02.) [[App Features]] puts a condition on its own number — ten is the working number and the screen has to earn it. Slice 1 is where that gets answered, including whether the practice table seats ten deliberately or runs smaller.

## Build order

The rules engine depends on no open question and no design, and it is the longest pole, so it leads.

1. **Apple Developer enrollment** — started first because it is waiting rather than working. Takes days, and it gates both device builds and the Apple sign-in spike.
2. **Rules engine, test-first.** [[Rules]] supplies the suite in its example-hands table.
3. **Table screen design** — the seat cap and the practice-seat count, with the four accessibility commitments built in rather than audited after.
4. **Practice table and the guided first game.**
5. **The two spikes from [[Tech Stack]], in parallel.** Neither blocks slice 1 — practice has no auth and no Colyseus room — but both can invalidate a slice 2 decision, so finding out early is free.

## Decision log

| Date | Decision | Why |
| --- | --- | --- |
| 2026-10-01 | First target is slice 1, practice only | Proves the game and the hardest screen with no backend, no accounts, and no store obligations. Practice already has to exist and work signed out, so it is not throwaway work. |
| 2026-10-01 | Four slices, groups last | Groups is the only cleanly severable feature — nothing else depends on it. Chat is where store compliance begins, since the four safety controls exist because the app carries player messages. |
| 2026-10-01 | Spikes run parallel to slice 1, not before it | A practice build exercises neither spike. They de-risk slice 2, so they run alongside rather than gating the first build. |

## Open questions

None at present.
| 2026-10-02 | Practice is a fixed four-seat table (three computer opponents) | Easier first screen. The cap is tested on the greybox via a dev-only override and in the bot simulator, and decided in slice 2. |
| 2026-10-02 | Privacy policy moves to "before slice 1 ships publicly" | Both stores require one regardless of data collected, and Sentry is data collected. |
