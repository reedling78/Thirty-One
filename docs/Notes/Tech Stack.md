# ThirtyOne — Tech Stack

## Scope

This is where technology choices get made. [[App Features]] says what the app does and [[Rules]] says how the game plays; this page picks what builds it. Each area below lists the requirements that drive it, the candidates, and a decision line to fill in. Choices are judged against two things: the feature requirements below, and the cost posture after them. Settled choices are recorded in the decision log at the bottom; areas still marked _open_ are undecided.

## What the features demand

These are the requirements from [[App Features]] that constrain the stack most. Any choice below should be checked against them.

| Requirement | Why it matters for the stack |
| --- | --- |
| Hidden hands and a 30-second turn timer | The server has to be authoritative: it deals, holds every hand, and runs the timer. The client cannot be trusted with either. |
| 60-second disconnect hold and crash recovery | Table state lives on the server and survives a client dropping; reconnecting has to resume a session, not start one. |
| Up to 10 players per table, many tables at once | Realtime fan-out per table, and a way to route every player at a table to the same game state. |
| Practice mode works signed out | The game engine has to run on the device too, against computer opponents, with no server. |
| Apple and Google sign-in only | Auth provider must handle both natively on iOS and Android. |
| Five chat channels with different retention | Chat storage needs per-channel TTLs (table lifetime, 200 msgs / 48h, one year), plus report copies kept 90 days. |
| Filtered messages, names, and pictures | Text moderation before display, image screening on upload. |
| Push for nine notification categories | APNs and FCM, with per-category opt-out. |
| Scheduled group games, idle-table close | Something has to fire jobs at a set time (open a table, close one after 15 minutes idle, purge expired chat). |
| In-app account deletion | Deleting a user has to cascade cleanly across auth, profile, chat, and friends. |

## Cost posture

Cost is a criterion here, alongside the requirements above. Every choice below should be checked against both.

Two numbers matter for each candidate. The **floor** — what it costs monthly with almost no players, which is what this app will actually pay for most of its life. And **what the cost scales with** — players, messages, writes, or nothing at all.

### Principles

- **Developer time dominates.** For a team this size it outweighs all infrastructure combined, probably for years. A choice that halves the build is worth more than one that saves $20/month.
- **Avoid per-unit pricing on things the app does constantly.** A turn is a write. At ten players a table across many tables, writes are the highest-frequency event in the app — which is why Firestore was ruled out for game state.
- **Avoid per-MAU pricing on features every player touches.** That bill scales with success, and it never stops.
- **Prefer a free tier that survives launch** over a cheaper paid tier, but never one that spins down on idle — a game server holding live tables cannot sleep.
- **Keep chat text-only.** Text moderation is free; image moderation is roughly $1–1.50 per thousand. [[App Features]] already specifies plain text, and that is worth keeping.

### The two traps

| Trap | Where it shows up |
| --- | --- |
| Per-MAU chat pricing | Stream Chat, Sendbird. Every signed-in player uses chat, so cost tracks growth directly. Building on the game server's socket has no marginal cost. |
| Per-write at game pace | Firestore for game state. Already rejected, but the principle applies to anything holding table state. |

### Launch floor

Rough monthly cost at near-zero players, assuming the decisions made so far:

| Item | Monthly |
| --- | --- |
| Game server (small always-on instance, Fly.io) | ~$3–5 |
| Postgres (Neon or Supabase free tier) | $0 |
| Redis (Upstash free tier) | $0 |
| Auth (Firebase) | $0 |
| Push (Expo + APNs/FCM) | $0 |
| Image moderation, per upload | <$1 |
| CI (GitHub Actions free tier) | $0 |
| **Infrastructure subtotal** | **~$5** |
| EAS Build Production (optional — local or CI builds instead) | $99 |
| Apple Developer | ~$8 (billed $99/yr) |
| Google Play | one-time $25 |

The headline: infrastructure is not the cost problem — tooling and developer time are. The whole backend runs for a few dollars a month until there are real players, and the largest recurring line item is an optional build service. Note that GitHub Actions bills **macOS runners at 10× the Linux rate**, so iOS builds burn the free CI allowance fast; EAS absorbs that, or Fastlane on your own runners trades one cost for the other.

## Decisions

### Language

One language across client, server, and a shared game-rules package means the practice engine and the server engine are the same code.

- **TypeScript everywhere** — shared rules package, one toolchain
- **Dart (client) + something else (server)** — only if Flutter wins below

**Decision:** **TypeScript everywhere.** Follows from the React Native client below. The Thirty-One rules engine ships as one shared package imported by both the on-device practice engine and the authoritative server, so the two cannot disagree on hand values, knocking, or corners.

### Mobile client

| Option                  | For                                                                        | Against                                              |
| ----------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------- |
| React Native + Expo     | TypeScript, shares the rules package, EAS for builds and push, OTA updates | Card animations need care (Reanimated / Skia)        |
| Flutter                 | Strong custom rendering, good for a game table                             | Dart — rules engine can't be shared with a TS server |
| Native (Swift + Kotlin) | Best platform feel                                                         | Two codebases for one developer-sized team           |

**Decision:** **React Native + Expo.** The deciding factor is the shared rules package, not performance. [[App Features]] requires practice mode to run offline on the device *and* the server to be authoritative, so the rules engine must exist in both places; TypeScript makes that one package instead of three implementations of the scoring logic. Nine of the eleven screens are lists, forms, and text, where a shared codebase pays most and native buys least, and the table screen is turn-based with idle frames between discrete card animations — Reanimated runs those on the UI thread, so it is not a performance-bound screen. Expo also pairs with the GitHub + Actions choice via EAS Build / Submit.

If the table screen ever proves inadequate, drop to **Skia for that one screen** rather than rewriting the other ten.

### Realtime game server

The core of the app: table state, dealing, turns, timers, reconnects.

| Option                                     | For                                                                                | Against                                                                                 |
| ------------------------------------------ | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Colyseus (Node)                            | Built for authoritative room-based games; rooms, state sync, reconnection built in | Another framework to learn; scaling across nodes needs its Redis presence driver        |
| Custom WebSockets (Node, `ws` / Socket.IO) | Full control, familiar stack                                                       | Rebuilding rooms, reconnection, and timers by hand                                      |
| Nakama                                     | Game backend with auth, chat, friends, groups included                             | Go/Lua/TS runtime, heavier to host, more than needed                                    |
| Firebase (Firestore + Functions)           | No servers to run                                                                  | Poor fit for an authoritative 30s timer and hidden state; costly per-write at game pace |

**Decision:** **Colyseus (Node).** The reconnect requirement decides it. [[App Features]] wants a 60-second seat hold where the player returns with hand and corner count untouched, the turn timer still running, and a crash treated the same as a dropped connection — that is exactly `allowReconnection(client, 60)`. Rooms map onto tables and the room lifecycle matches the table lifecycle, including the 15-minute idle close on a room timer. Open source, so the only cost is the machine it runs on.

Per-table state is small — deck order, three hidden cards per player, the discard pile, seat and turn order, corner and bus counts, knock state — and writes happen about once per turn, so this is not a throughput problem.

**Prototype first, before building anything on top:** hidden hands. Colyseus's per-client `@filter()` is the least-travelled part of its API, and a leak of another player's cards is game-breaking. Preferred approach is to keep hidden cards **out of synced state entirely** — hold hands in plain room memory, push each player their own hand over a direct message, and sync only public state (card counts, discard top, whose turn, corners). At the knock, [[Rules]] makes every hand public, so the reveal is a deliberate transition rather than a filter change.

Socket.IO was reconsidered on 2026-09-26 and set aside. The case for it was real — if hidden cards stay out of synced state, Colyseus is being used for rooms, reconnection, and timers rather than its headline state sync, and explicit control over every byte a player receives has genuine value for a hidden-hand game. Colyseus kept on one ground: reconnection is the requirement most likely to produce subtle timing-dependent bugs, and it is the best place to use someone else's tested code. If this is revisited, prefer **Socket.IO over bare `ws`** — its rooms, heartbeats, client-side reconnect with backoff, and Redis adapter cover most of the gap, leaving only session resumption to write.

**Keep the rules engine transport-agnostic.** Deal, score, knock, and resolve should be pure functions over a state object with no knowledge of Colyseus. The offline practice engine requires this anyway, and it makes the socket layer a thin shell — so a future move to Socket.IO would rewrite the shell, not the game.

### Hosting

Colyseus needs a long-lived process, so the game server cannot be a Lambda. Cost separates these more than capability does at launch scale: a small always-on instance on Fly.io runs a few dollars a month, Render's smallest paid service about $7 (its free tier spins down on idle, which would drop live tables), and ECS Fargate roughly $9 for the task plus **$16–18 for the ALB alone** — so AWS starts near $30/month at zero players for the same launch capability.

| Option | For | Against |
| --- | --- | --- |
| AWS — ECS Fargate for game server, Lambda for APIs | Matches what the team already runs; ALB supports WebSockets | More to wire up for a side project |
| Fly.io / Render | Simple deploys, long-lived connections are fine | Less control, smaller ecosystem |
| Firebase / GCP | Pairs with Firebase Auth and FCM | Only makes sense if the game server isn't Firebase-native anyway |

**Decision:** **Fly.io**, with AWS as the migration target if scale or team preference demands it. Chosen on fit as much as cost: machines are long-lived rather than request-oriented, WebSockets pass through natively, and `fly-replay` gives sticky routing to the node holding a table when a second node is needed. Upstash Redis is a first-class add-on, which suits the Ephemeral state row. The floor is a few dollars a month against roughly $30 for ECS Fargate plus an ALB — a ~6× gap during the period with no revenue.

Firebase Auth does not require hosting on GCP, so it stays available regardless. Cloud Run was ruled out: it is request-oriented and can scale instances down underneath live tables.

Two conditions on this choice:

- **Never enable scale-to-zero.** Set `min_machines_running = 1`. A sleeping server loses live tables, which is the failure mode most likely to make players distrust the app.
- **Solve graceful shutdown early.** Colyseus should catch `SIGTERM`, stop accepting new rooms, and let live tables finish or checkpoint before the process exits. Rolling deploys otherwise kill every game in progress. This matters more than the choice of host, and every host handles it badly by default.

This would flip if an ALB were already running for other services — the marginal cost of adding the game server to it is near zero.

### Auth

| Option | For | Against |
| --- | --- | --- |
| Firebase Auth | Apple and Google out of the box, free tier, easy account deletion | Ties identity to Google |
| Supabase Auth | Pairs with Postgres, row-level security | Pulls toward Supabase for the rest |
| AWS Cognito | Stays inside AWS | Clunkier developer experience for social sign-in |
| Verify Apple/Google tokens ourselves | No vendor | We own session management and edge cases |

**Decision:** **Supabase Auth**, as half of a bundle with Supabase Postgres below. Auth and Database were decided together because the realistic choices are bundles, not independent picks.

The deciding factor is **account deletion**. [[App Features]] requires it in-app, effective at once, with messages removed or stripped of their name — and the app stores require it of any app that creates accounts. When `auth.users` lives in the same Postgres as the application tables, that cascade is foreign keys with `ON DELETE CASCADE`. Across a Firebase-to-Postgres seam it is a two-phase operation you hand-roll, and a half-deleted account is both a bug and a compliance problem.

**Spike before committing:** Apple sign-in in Expo. Supabase's Apple flow needs more configuration than Firebase's, and Apple's private-relay email addresses are a known source of trouble. Firebase Auth is the smoother auth product for a mobile client and free at any scale this app will reach — if the spike goes badly, **Firebase Auth + Neon Postgres** is the fallback bundle, at the price of writing a careful deletion job.

### Database

Durable data: users, profiles, chips won, friends, blocks, groups, schedules, chat history, reports.

| Option | For | Against |
| --- | --- | --- |
| Postgres (RDS, Neon, or Supabase) | Relational fit for friends, groups, blocks; easy leaderboard queries | Chat retention needs scheduled purges |
| DynamoDB | Native TTL fits chat retention; serverless | Friends/leaderboard queries need careful key design |
| Firestore | Realtime listeners, TTL policies | Weak for relational queries; ties to Firebase |

**Decision:** **Postgres on Supabase**, bundled with Supabase Auth above. Almost all of the durable data is relational: friends and blocks are directed one-sided edges, groups and RSVPs are many-to-many, and the leaderboard is an `ORDER BY` on chips won. Blocks are checked on every message display, which is a join rather than a per-message read. Free tier covers launch, then $25/month.

Chat retention is the one place this loses. Five channels with five different rules — table chat dies with the table, general keeps 200 messages or 48 hours, group/DM/support keep a year, reports keep 90 days — need scheduled purges, where DynamoDB and Firestore would do it with native TTL. That is one row winning against six, and the Scheduled jobs row has to exist anyway for group games and idle-table close. If chat volume ever justifies it, partition by day so a purge is a partition drop rather than a mass delete.

Note that free-tier Supabase projects pause after about a week of inactivity, which can bite during quiet development stretches.

### Ephemeral state and presence

Online status, "at a table now", live table listings, pending join requests.

- **Redis** (ElastiCache / Upstash) — presence, pub/sub between game server nodes, Live Game Room listing
- **In game-server memory only** — fine for a single node, breaks on the second

**Decision:** **Redis, on Upstash.** Taken now rather than deferred to the second node, because in-memory presence is code that gets thrown away rather than extended — the single-node version and the multi-node version are different programs, and writing the first one means writing the second one later under pressure. Upstash's free tier covers launch, and it is the Redis that pairs with the Fly.io choice.

It earns its place three ways: presence and "at a table now" for the friend list, the Live Game Room listing, and pub/sub between game server nodes, which is what Colyseus's Redis presence driver needs when a second node appears. It also gives the Scheduled jobs row a free option in BullMQ.

This does mean three vendors — Fly.io, Supabase, Upstash. Accepted: Supabase has no Redis, and Fly.io's own Postgres is unmanaged, so consolidating would cost more than the split does.

Durable data still belongs in Postgres. Redis holds only what can be lost on restart — presence, listings, pending join requests. Anything that must survive a deploy goes in the database.

### Chat

| Option | For | Against |
| --- | --- | --- |
| Build on the game server's socket connection | One connection, full control of retention and blocking | Moderation, history, and unread handling are ours to build |
| Stream Chat / Sendbird | Channels, history, moderation, blocking included | Cost per MAU; blocking/retention rules must map onto theirs |

**Decision:** **Build on the game server's socket, messages in Supabase.** Chosen on fit as much as cost. Three requirements in [[App Features]] cut against a managed service's model: blocking is one-sided and silent, so it cannot be enforced at send and must be a per-viewer filter on render; table chat has no backfill, which is the opposite of every chat product's default; and a reported message outlives its channel by 90 days, so report copies land in our own database regardless. Against Stream or Sendbird, those would mean fighting the vendor's model *and* still writing custom code, at a per-MAU price the cost posture names as a trap.

Everything needed is already in the stack: an authenticated socket per player, Colyseus rooms matching tables, blocks and friends as relational tables so the block filter is a join, and pg_cron scheduled for the purges.

**Scope cut on 2026-09-26: general chat dropped**, leaving four channels. [[App Features]] is updated to match. General was the only unbounded channel — every online player subscribed to one room, fanning out through the game server process — so cutting it removes the one scaling risk in chat. It also carried the only count-based retention rule (200 messages or 48 hours), so the purges collapse to two pg_cron jobs: a one-year sweep across DM, group, and support, and expired reports at 90 days. Support is kept, which keeps the report flow and all four safety controls intact.

Still ours to build: unread counts (a per-channel `last_read_at` per player, the fiddliest part), cursor-based pagination, rate limiting, and the moderation filter running before display. Support chat also needs an operator-side view, since it is player-to-operator rather than player-to-player.

### Moderation

- **Text:** OpenAI moderation API, Google Perspective, or a word-list filter to start
- **Images:** AWS Rekognition moderation, Google Cloud Vision SafeSearch, or Hive

**Decision:** **Layered on text, Google Vision SafeSearch on images.** [[App Features]] requires filtering `before a message is shown`, so this lives in the send path of the chat decided above, and it applies to three things with very different latency budgets.

| Target | Check | Timing |
| --- | --- | --- |
| Chat messages | Word list in-process, then OpenAI moderation | Word list blocks instantly; the API call runs **async**, off the critical path, and a flagged message is retracted or hidden a moment later |
| Display names | OpenAI moderation | **Synchronous**, at sign-up and on edit. A second of latency is invisible here, and a bad name is permanent and appears in every seat and chat line |
| Profile pictures | Google Cloud Vision SafeSearch | **Synchronous**, on upload. An upload already feels like it takes a moment |

The layering exists to keep a network round-trip out of the live-game path: a word list stops careless offensiveness in sub-millisecond time, while the API stops deliberate abuse without delaying a message appearing at the table. OpenAI's moderation endpoint is free and its categories map onto what the app stores care about; Perspective is an equally defensible swap if per-category thresholds are wanted.

Images are profile pictures only now that chat is text-only — one per player, one-time, so the ~$1–1.50 per thousand is cents per month. Vision SafeSearch over Rekognition because a GCP project is lighter to add than an AWS account this stack otherwise does not need.

**Known tradeoff:** async text moderation means a bad message is briefly visible — a second or two at a table of ten. Accepted. If that proves wrong in practice, the fix is synchronous API checks, which a 30-second turn can absorb.

The report flow is the real backstop. Automated filters miss things, and [[App Features]] already has report, block, and support acting on reports — which is what the stores actually require.

### Push notifications

- **Expo Notifications** — if the client is Expo
- **FCM directly** — covers Android, and iOS via APNs
- **OneSignal** — adds a dashboard and segmentation

**Decision:** **Expo Notifications.** Its condition — "if the client is Expo" — is now met. It wraps APNs and FCM behind one push API and handles token registration, which is what the nine notification categories and their per-category opt-outs need. Expo's push service sits in front of APNs/FCM, so if that hop ever becomes a problem, FCM directly stays available as a fallback without changing the client architecture.

### Scheduled jobs

Group games opening on time, idle tables closing after 15 minutes, chat purges.

- **EventBridge Scheduler + Lambda** — one-off schedules per group game
- **In-process timers on the game server** — fine for idle-close, not for games scheduled days out
- **A job queue** (BullMQ on Redis) — if Redis is already in the stack

**Decision:** **Split three ways, by the shape of the job.** These are three different problems, and one tool for all of them fits badly somewhere. EventBridge is off the table now that hosting is Fly.io rather than AWS.

| Job | Handled by | Why |
| --- | --- | --- |
| Idle-table close, 15 min | Colyseus room timer | Not really a scheduled job — a resettable timer inside a room that already holds the state. An external scheduler would round-trip to ask what the room already knows. |
| Chat purges: group / DM / support (1 year), reports (90 days) | `pg_cron` in Supabase | Pure SQL on a fixed cadence against tables in the same database. No network hop, no extra service, no cost. Two jobs, since the three channels share a one-year rule. |
| Table chat purge | Event on game end | Fires when the table closes, not on a schedule. |
| Scheduled group games — open the table, notify everyone who said yes | BullMQ on Upstash Redis | The only job needing durable per-item scheduling: a specific time days out, cancellable and reschedulable. BullMQ's delayed jobs are exactly that primitive, and retries matter because a failed notification send should not be silent. |

**Where the worker runs:** in the game server process to start. Simplest, and fine at launch — but it means a job and live tables share a process, so a heavy job could stall turns. Split it onto its own Fly machine if interference shows up.

Watch Upstash command consumption: BullMQ polls Redis for delayed jobs, and Upstash prices per command. Expected to sit inside the free tier, but it is the thing that would push past it.

**Simpler alternative if BullMQ proves not worth it:** `pg_cron` for everything, with a minute-ly job that opens any group game whose time has passed. One fewer dependency and no worker process, at the cost of up to a minute of imprecision — which nobody would notice on a game scheduled days out. This was close, and the only reason it lost is that RSVPs and notifications make group games stateful enough to want real retries.

### Tooling

| Area | Candidates | Decision |
| --- | --- | --- |
| Source control and CI | GitLab + GitLab CI, GitHub + Actions | **GitHub + Actions** |
| Mobile builds and store submission | EAS Build / Submit, Fastlane | **EAS Build / Submit**, free tier to start |
| Crash and error reporting | Sentry, Crashlytics | **Sentry** |
| Product analytics | PostHog, Amplitude, Firebase Analytics | **Deferred** — PostHog when needed |
| Infrastructure as code | `fly.toml` + Supabase migrations, Terraform | **`fly.toml` + Supabase migrations**, no IaC tool |
| Testing | Vitest, Jest | **Vitest** on the shared rules package |

**Mobile builds.** EAS manages iOS signing and provisioning, which is the genuinely miserable part of mobile CI, and it follows from the Expo choice. Start on the free tier and upgrade to Production ($99/month) only when the build queue actually hurts — it would be the largest recurring cost in the stack, and it is optional. Fastlane is free as software but needs macOS runners, which GitHub Actions bills at 10× Linux, and hands you certificate management. `eas build --local` in CI is the hybrid if the hosted queue becomes the problem.

**Crash reporting.** Sentry covers the React Native client *and* the Node game server in one place, which decides it — an unhandled exception on an authoritative server can kill live tables, and having those correlated with client crashes by release is worth more than Crashlytics' edge on native symbolication. Crashlytics is mobile-only, so the server would need a second tool anyway, and it pulls in Firebase, which this stack otherwise avoids. Free tier covers launch.

**Product analytics — deferred deliberately.** Analytics on an app with no players answers nothing, and instrumenting unvalidated events is wasted work. PostHog is the pick when it is wanted: the most generous free tier of the three, plus session replay and feature flags. Pull it in early only if feature flags are needed to roll out something like the guided first game.

**Infrastructure as code.** The original candidates (AWS CDK, Terraform, SST) all assumed AWS and were dropped with it. With one Fly app, one Supabase project, and one Upstash instance, Terraform would be ceremony over three things provisioned once. `fly.toml` is already a committed file, and Supabase migrations belong in version control regardless — that is schema management, not IaC. Revisit if staging environments need to be reproducible.

**Testing.** The shared rules package is the highest-value thing to test in the app: it runs in both the offline practice engine and the authoritative server, and [[Rules]] supplies a ready-made suite in its example-hands table — including the suited Q-K-A that must read 31 rather than 30, the Ace-low straight beating its suited total, and the off-suit cases. Vitest for speed and TypeScript support out of the box.

## Before building

Collected from the decisions above. The first two can invalidate a decision if they go badly, so they come before anything is built on top of them. The rest are setup steps and things to keep an eye on.

### Spikes — prove these first

| Spike | Why it could change a decision | If it fails |
| --- | --- | --- |
| **Hidden hands in Colyseus** | A leak of another player's cards is game-breaking, and `@filter()` is the least-travelled part of the API | Keep hands out of synced state entirely — plain room memory, pushed per player, public state only |
| **Apple sign-in in Expo with Supabase Auth** | Supabase's Apple flow needs more configuration than Firebase's, and private-relay email addresses are a known trap | Fall back to **Firebase Auth + Neon Postgres**, and write a careful two-phase deletion job |

### Build requirements

These are not selections; they are things that have to be built or turned on.

- **`SIGTERM` draining on Fly.io.** Colyseus must stop accepting new rooms and let live tables finish or checkpoint before the process exits. Without it, every deploy kills every game in progress. Matters more than the choice of host.
- **`min_machines_running = 1`.** Never scale to zero. A sleeping server loses live tables.
- **Enable `pg_cron` in Supabase.** It is an extension, off by default, and two purge jobs depend on it.
- **Keep the rules engine transport-agnostic.** Deal, score, knock, and resolve as pure functions over a state object, with no Colyseus awareness. Required by the offline practice engine, and it is what makes the realtime-server decision cheap to reverse.
- **Keep the moderation filter off the live-game path.** Word list in-process on send; the API call async.

### Watch items

- **Upstash command consumption.** BullMQ polls Redis for delayed jobs and Upstash prices per command. Expected to stay inside the free tier, but this is what would push past it.
- **GitHub Actions macOS minutes.** Billed at 10× the Linux rate, so iOS builds burn the free allowance fast. EAS absorbs most of this.
- **Supabase free-tier pausing.** Projects pause after about a week of inactivity, which can bite during quiet development stretches.
- **Worker placement.** BullMQ starts in the game server process. Split it onto its own Fly machine if jobs start interfering with turns.

## Decision log

| Date | Area | Chosen | Why |
| --- | --- | --- | --- |
| 2026-09-26 | Source control and CI | GitHub + Actions | Largest ecosystem of ready-made actions for the mobile path (EAS, Fastlane, store submission); CI lives next to the code with no second tool to run. |
| 2026-09-26 | Mobile client | React Native + Expo | One rules package shared by the offline practice engine and the authoritative server, instead of three implementations of the scoring logic. Nine of eleven screens are lists and forms; the table screen is turn-based, so it is not performance-bound. Skia is held in reserve for the table screen alone. |
| 2026-09-26 | Language | TypeScript everywhere | Follows from the React Native client. Client, server, and the shared rules package are one language and one toolchain. |
| 2026-09-26 | Push notifications | Expo Notifications | Its stated condition — an Expo client — is now met. One push API over APNs and FCM, with token registration handled, for the nine notification categories and their opt-outs. |
| 2026-09-26 | Realtime game server | Colyseus (Node) | `allowReconnection` is the 60-second seat hold, which is the requirement hardest to rebuild by hand. Rooms map onto tables; room timers cover the idle close. Open source, so cost is just the host. Hidden hands to be prototyped first, kept out of synced state rather than relying on `@filter()`. |
| 2026-09-26 | Hosting | Fly.io | Long-lived machines rather than request-oriented, native WebSockets, `fly-replay` for sticky routing at a second node, Upstash Redis as an add-on. Floor is a few dollars against ~$30 for Fargate + ALB. Conditions: never scale to zero, and solve `SIGTERM` draining early. AWS is the migration target. |
| 2026-09-26 | Tooling — mobile builds | EAS Build / Submit, free tier first | Manages iOS signing and provisioning, the worst part of mobile CI, and follows from Expo. Upgrade to the $99 Production tier only when the queue hurts; Fastlane needs macOS runners at 10× Linux and hands back certificate management. |
| 2026-09-26 | Tooling — crash reporting | Sentry | Covers the RN client and the Node game server in one place, correlated by release. A server exception can kill live tables, so server coverage matters; Crashlytics is mobile-only and pulls in Firebase. |
| 2026-09-26 | Tooling — product analytics | Deferred; PostHog when needed | Analytics on an app with no players answers nothing. PostHog when the time comes, or earlier if feature flags are wanted. |
| 2026-09-26 | Tooling — infrastructure as code | `fly.toml` + Supabase migrations, no IaC tool | Original candidates all assumed AWS. One Fly app, one Supabase project, one Upstash instance is too little for Terraform's drift management to earn its keep. Migrations are needed regardless. |
| 2026-09-26 | Tooling — testing | Vitest on the shared rules package | New row. The rules engine runs in both the practice client and the server, and [[Rules]] already supplies the test cases in its example-hands table. |
| 2026-09-26 | Moderation | Word list + OpenAI (async) on messages; OpenAI (sync) on names; Vision SafeSearch on pictures | Layered to keep a network round-trip out of the live-game path. Names are checked synchronously because a bad name is permanent and everywhere. Images are profile pictures only, so cost is cents. Accepted tradeoff: a flagged message is briefly visible before retraction. |
| 2026-09-26 | Chat | Build on the game server's socket, messages in Supabase | One-sided silent blocking, no-backfill table chat, and reports outliving their channel all fit our own queries better than a vendor's model — a managed service would mean fighting it and still writing custom code, at per-MAU cost. Socket, rooms, relational blocks, and pg_cron are already in the stack. |
| 2026-09-26 | Scope — messaging | General chat cut; four channels remain | Dropped from [[App Features]] as well. It was the only unbounded channel, fanning out to every online player through the game server process, and the only count-based retention rule. Support kept, so the report flow and all four safety controls survive. |
| 2026-09-26 | Scheduled jobs | Split: Colyseus room timers + pg_cron + BullMQ | Three job shapes, three tools. Idle-close is a room timer, not a scheduled job. Chat purges are SQL on a cadence, so pg_cron runs them where the data is. Group games are the only durable per-item schedules, which is BullMQ's delayed-job primitive, with retries for failed notifications. Worker in-process to start. EventBridge dropped with AWS. |
| 2026-09-26 | Ephemeral state and presence | Redis on Upstash | Taken at launch rather than deferred: in-memory presence is thrown away at the second node, not extended. Covers presence, the Live Game Room listing, and the pub/sub Colyseus's Redis driver needs to scale out. Free tier covers launch. Durable data stays in Postgres; Redis holds only what can be lost on restart. |
| 2026-09-26 | Auth + Database | Supabase Auth + Supabase Postgres | Decided as a bundle. Account deletion is the deciding factor: identity and application data in one Postgres makes the required immediate cascade a foreign-key concern rather than a hand-rolled two-phase delete across a vendor seam. Postgres also fits the relational core — friends, blocks, groups, RSVPs, leaderboard. Apple sign-in in Expo to be spiked first; fallback bundle is Firebase Auth + Neon. |

## Open questions

None at present. Both earlier questions were closed on 2026-10-02: chat and presence ride on the game server (already decided under Chat and Ephemeral state), and launch runs on **one Fly machine until measured otherwise** — per-table state is a few kilobytes and writes are one per turn, so a small shared-CPU machine carries hundreds of tables. Slice 2 adds a live-table-count metric so the second node is a measurement, not a guess.
| 2026-10-02 | Launch scale | One Fly machine until measured | Per-table state is a few KB with one write per turn. The Redis presence driver and `fly-replay` are already chosen for the second node; a table-count metric in slice 2 says when. |
