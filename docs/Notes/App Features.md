# ThirtyOne — App Features

## Scope

This document describes what the app does and how it is organized: the screens, the flows between them, and the rules that govern each interaction. Technology choices, architecture, and implementation are deliberately out of scope and belong in a separate document.

The rules of the card game itself are also out of scope — they live in [[Rules]]. This document covers everything wrapped around the game: getting in, finding a game, joining one, and talking to other players.

## App structure

A signed-out player lands on a practice table. Once signed in, the app has one hub — the Live Game Room — and everything else is reached from it; opening the app goes there, unless a game they are seated at is still running, in which case they land back at that table.

| Screen | What it is for | Reached from |
| --- | --- | --- |
| Sign in | Apple or Google sign-in | Reaching for anything multiplayer while signed out |
| Live Game Room | Browse every open table, request to join one, or start your own | Landing screen; back from any other screen |
| Table | The game itself: seats, hands, play | Joining a table, or creating one as host |
| Practice | A four-seat table against three computer opponents; no pot and no chips won | Live Game Room, and the signed-out home |
| Rules | How to play: card values, knocking, lives | Live Game Room, and inside a table |
| Leaderboard | You and your friends ranked by chips won | Profile, and the friend list |
| Groups | Your groups: roster, group chat, scheduled games | Profile, and the friend list |
| Profile | Your display name, picture, and chips won | Live Game Room |
| Friends | Your friend list — who is online and what they are playing | Profile |
| Settings | Sign out, notification toggles, blocked players | Profile |
| Chat | In-game messages, group chat, direct messages, and support | Live Game Room and inside a table |

## Signed out and signed in

The app opens playable. Someone who has never signed in lands on a practice table against computer opponents and can play as long as they like without an account. Sign-in is what unlocks other people.

| Works signed out | Needs an account |
| --- | --- |
| Practice games against computer opponents | The Live Game Room and every real table |
| The rules screen and the guided first game | A profile — display name, picture, chips won |
| Accessibility and sound settings | Chat of any kind, friends, groups, the leaderboard |

This also keeps the app on the right side of the stores, which do not allow an app to demand an account for features that do not need one.

### Signing in

Sign-in is Sign in with Apple or Sign in with Google — nothing else. There is no email-and-password option, no username, and no password recovery to build or support. Apple sign-in is required for App Store approval on iOS; Google covers Android and gives iOS players a second option.

A player is asked to sign in the moment they reach for something multiplayer, not on launch. On their first sign-in they set a display name before entering the Live Game Room, since every other screen shows players by name. A profile picture is optional and can be added later.

Nothing carries over from signed-out play. Practice has no pot and no chips won, so there is no progress to migrate and no guest account to reconcile.

After the first sign-in, opening the app goes to the Live Game Room, or back to a game still running. Signing out, from settings, returns the player to the signed-out state, where practice still works.

## Profile

A profile is deliberately thin — enough to recognize a player at a table and nothing more.

| Field | Set by | Shown to others |
| --- | --- | --- |
| Display name | The player, at first sign-in; editable later | Yes — in the table, the Live Game Room listing, and chat |
| Profile picture | The player, optional | Yes — in the seat at the table and beside chat messages |
| Chips won | The app, from completed games | Yes |

Chips won is a running total across every game the player has finished. Each finished game pays its winner one chip for every player who bought in, so a four-player game pays the winner four chips. It is the only stat on the profile, and it is what the friends leaderboard ranks.

The game is played for chips, not money. Nothing is purchasable, nothing pays out, chips cannot be transferred between players, and every player starts even. The app calls them chips everywhere a player can see — the buy-in, the pot, and the profile stat — so nothing in it reads as gambling.

A player reaches their own profile from the Live Game Room, and can view another player's profile by tapping their name or picture at a table.

Display names and profile pictures are player-supplied content, so both are checked. Names run through the same filter as messages and pictures are screened automatically. Either can be reported from the player's profile, and support can reset a name or picture to a default.

## Tables

A table is one game. Any signed-in player can start one, and doing so makes them its host. The moment a table is created it is listed in the Live Game Room as live, where other players can find it.

Every table seats up to 10 players. The cap is the same for every table in the app; the host does not choose it. Ten is the working number, and the table screen has to earn it — ten hands, the draw and discard piles, and each player's corner count all readable at once. If the design cannot carry ten comfortably, this number comes down.

The host names the table when they create it, and that name is what other players see in the Live Game Room. The host also chooses whether the table is public or private. A public table is listed for everyone, and anyone can request a seat. A private table is not listed at all — the host invites players through a direct message, and tapping that invite takes the player to the table. The invite is the host's decision, so an invited player is seated without a separate request.

The host holds a seat like everyone else and plays the game normally. Creating a table does not start it: the table sits open, collecting players, until the host starts the game.

A table keeps existing until the game ends or the host leaves before it starts. An open table that nobody joins, chats in, or starts closes itself after 15 minutes idle, and anyone still sitting in it goes back to the Live Game Room.

## Live Game Room

The Live Game Room is the app's landing screen and its only game browser. Every public table appears in it as a listing; a private table is reached through an invite the host sends by direct message. A player taps a listing to send the host a request to join; there is no instant join and no invite link.

Each listing shows enough to decide whether to knock on the door:

- The table's name
- The host's display name and picture
- Seats filled out of seats available
- Its status — open for requests, or in progress

A player who has requested to join sees that listing marked as pending while they wait. The request resolves one of two ways: the host accepts and the player is taken into the table, or the host denies it and the player stays in the Live Game Room and may request another game.

A table can only be joined before it starts. Once the host starts the game its listing stays in the room, marked in progress and no longer tappable, so players can see the table is running but cannot request a seat. No one new is seated for the rest of that game — not even in the place of a player who was booted. The listing leaves the room when the game ends.

### When the room is empty

Early on, and at quiet hours, a player will open the app to an empty room. Four things keep them from closing it again.

| Option | What it does |
| --- | --- |
| Quick play | One button seats the player at a public table with a free seat, or opens a table for them if there is none |
| Start a table | The empty room points the player at creating their own, and at inviting friends from the friend list while it waits |
| Practice | A table against computer opponents — no pot, no chips won, and the place a new player learns the game |
| Notify me | The player arms a notification and is pinged the moment anyone opens a table |

Quick play seats a player without a join request, so a host who wants to vet every player makes their table private instead.

## Host controls

The host runs the table. Everything on this list is available to the host alone, from the table screen.

| Control | When it is available | Effect |
| --- | --- | --- |
| Accept a join request | Before the game starts, while a seat is open | The player takes a seat at the table |
| Deny a join request | Before the game starts | The request is refused; the player returns to the Live Game Room |
| Start the game | Any time two or more players are seated | The table stops accepting requests and the first hand is dealt |

The host decides when to start — there is no countdown and no minimum wait. Two seated players is the floor, and a full table is not required.

Hosting survives the host leaving. If the host is timed out or quits, the role passes to whoever has been seated longest among the players still in the game, so the table can still offer a rematch when the game ends. A table whose host leaves before the game starts still closes.

## Turn timer

Each turn is capped at 30 seconds. A player who has not drawn and discarded — or knocked — before the timer runs out is booted from the game automatically. The timer applies to every player, the host included, and it is what handles a player who goes away from the keyboard. The host has no boot control.

A player booted by the timer, or who quits on their own, forfeits their chip to the pot and is out. Their corners leave with them and count for nothing.

The round in progress carries on without them: their hand is set aside, the turn passes to the next seat, and a knock in progress stands. The hand is never re-dealt, so quitting cannot reset a round a player is about to lose. Everyone else's corner count is untouched.

If the timer empties a table down to a single player, the game ends with no winner. The pot is lost — including the last player's own chip — and nothing is added to anyone's chips won. A game only pays out when it is played to a finish.

### Disconnects

A dropped connection is not the same as going away from the keyboard. A player who loses their connection is marked disconnected in their seat, and the seat is held for 60 seconds while the game carries on around them. Coming back inside that window puts them straight back in with their hand and corner count untouched.

The turn timer does not wait for them. If the turn reaches a disconnected player, their 30 seconds runs like anyone else's and running out boots them on the usual terms. A player still gone when the 60 seconds is up is out the same way.

The other players see the disconnected marker on that seat, so a slow table explains itself.

A crash or a force-quit is treated the same way as a dropped connection. Reopening the app inside the window puts the player back at their table; after it, or with no game running, they land in the Live Game Room.

## End of game

When a game is won, the table shows a results screen: the winner, the pot they took, and the order the other players went out in. Chips won is credited at that moment.

From the results screen a player either leaves, which returns them to the Live Game Room, or takes the rematch. Rematch reopens the same table with the same players seated and the same host, waiting for the host to start again. Seats freed by players who left are open, and the table is listed in the Live Game Room again while it waits, so it can fill back up.

If the host leaves from the results screen, the table closes and everyone else returns to the Live Game Room.

## Learning the game

Thirty-One is not a game most players will already know, and the scoring in particular is not obvious from watching. The app teaches it three ways.

- **Rules screen** — card values, knocking, and the corners-and-bus lives, reachable any time from the Live Game Room and from inside a table
- **Guided first practice game** — the first practice game talks the player through a turn at a time: what they can draw, what their hand is worth, when knocking is worth it
- **Hand value on screen** — the table always shows what a player's three cards are worth and which suit is carrying the total, in every game and not just practice

## Accessibility

Four commitments, all of which shape the table screen rather than following it:

- **Suits do not rely on color.** Suit symbols and shapes carry the information, never red against black alone. Around one man in twelve cannot separate those reliably at a glance, and this is a card game.
- **Text scales with the phone.** Names, chat, and hand values follow the system text size rather than being fixed.
- **The turn timer is not a color.** The 30 seconds shows as a number and a shrinking bar, with an optional sound, not a seat that quietly turns red.
- **Everything is labeled.** Cards, seats, and buttons carry labels, so the game is playable with VoiceOver and TalkBack.

## Messaging

Messaging is plain text between players, organized as channels. How notifications work is a detail for later.

| Channel | Who is in it | Purpose |
| --- | --- | --- |
| Table chat | The players seated at one table | Talk during the game; opens with the table and closes with it |
| Group chat | The members of one group | Where a group talks between games and sorts out when to play |
| Direct message | Two players | A private conversation between them, and how a host invites players to a private table |
| Support | The player and the app's operators | Report a problem or a player |

Table chat is reachable from inside the table without leaving the game. Support and direct messages are reachable from the Live Game Room, a direct message is started from the other player's profile, and a group's chat is reached from that group.

### History

Each channel keeps messages for a different length of time, and only some of them show a player what they missed.

| Channel | Kept for | Messages sent while a player was away |
| --- | --- | --- |
| Table chat | The life of the table — gone when the game ends | Not shown; a player sees only what is said after they sit down |
| Group chat | A year, like direct messages | Always shown |
| Direct message | A year, or until one side deletes the conversation | Always shown |
| Support | A year | Always shown |

A reported message outlives the channel it was sent in. Filing a report copies the message aside and keeps it for at least 90 days, so a report about table chat is still reviewable after that table is gone.

The turn timer, not the host, deals with a player who stalls a table. Anything else a player wants handled goes to support for now.

### Safety controls

Carrying player-to-player messages means the app has to ship the safety controls the app stores require. All four are launch features, not later additions.

| Control | Where a player uses it | What it does |
| --- | --- | --- |
| Report | On a message, or on a player's profile | Sends the message and the player to support for review |
| Block | On a player's profile | Hides that player's messages everywhere and stops direct messages between the two; one-sided and immediate |
| Filter | Automatic | Objectionable content is filtered out before a message is shown; the same check runs on display names and profile pictures |
| Act on reports | Support side | Support reviews reports and can remove a player from the app |

Blocking only hides chat. The two players can still be seated at the same table and play each other normally — they just do not see each other's messages. A blocked player is not told they have been blocked. Support contact details are published in the app.

## Notifications

The app sends push notifications for the handful of things that are time-sensitive — mostly moments where a player is holding someone else up.

| Notification | Sent when |
| --- | --- |
| Join request | Someone asks to join your table (host only) |
| Request accepted | A host lets you into their table |
| Game starting | The host starts a game you are seated at |
| Your turn | The turn reaches you and the 30-second timer is running |
| Direct message | Someone messages you, including a private table invite |
| Table opened | Someone opens a table while you have notify-me armed |
| Group game scheduled | A member of your group proposes a time to play |
| Group game starting | A scheduled game's table opens, if you said you were coming |
| Group invite | Someone invites you to a group |

Table chat does not send notifications. Each category can be turned off by the player, and the app asks for notification permission the first time it has something to send rather than at sign-in.

## Friends

A player adds another player as a friend from their profile. Adding is one-sided, the way following works — there is no request to send and nothing for the other player to accept. The friend list shows each friend's display name and picture, whether they are online, and whether they are sitting at a table right now.

From the list a player can send a friend a direct message or invite them to a private table, which makes the friend list the quickest route into a game with people you know.

Blocking overrides friending. A blocked player cannot be added, and blocking someone already on the list removes them from it.

### Leaderboard

The leaderboard ranks a player against the friends on their list by chips won, and nothing else. There is no global ranking: an all-time board across everyone rewards whoever plays the most rather than whoever plays well, and it is the first thing anyone would try to game. The leaderboard is reached from the friend list and from the profile.

## Groups

A group is a named set of players who play together regularly — the app's version of a clan. Any player can create one, name it, and invite others. Members see the roster, who is online, and a chat channel of their own. A player can belong to several groups and can leave any of them at any time.

| What a group gives you | |
| --- | --- |
| Roster | Every member, with who is online and who is at a table right now |
| Group chat | A channel just for the group, listed alongside the app's other channels |
| Scheduled games | A time the group is playing, and who is coming |
| Group table | Open a private table and invite the whole group in one step |

Blocking still applies inside a group: a blocked player's messages stay hidden in group chat, and neither player is forced into a conversation with the other.

### Scheduled games

Any member can propose a day and time. Everyone in the group is notified and marks themselves in or out, and the group screen shows who has said yes.

At the appointed time the app opens a private table for the group and notifies everyone who said yes. The member who proposed the game hosts it. Seats are held for the players who said yes; anyone who said no or never answered can still take a free seat once the table is open, first come first served, and the ten-seat cap applies as it does anywhere else.

A scheduled game that nobody turns up for closes like any other idle table.

## Settings

Settings is reached from the profile screen and holds the few things that are not part of playing:

- Sign out
- Notification toggles, one per category in the table above
- Blocked players, with an unblock beside each name
- The friend list
- Delete account
- Links to the privacy policy and the terms

Deleting an account happens in the app and takes effect at once: the account and profile go, the player's messages are removed or stripped of their name, and their chips won goes with them. The app spells that out before asking the player to confirm. In-app deletion is not optional — the app stores require it of any app that creates accounts.

## Decision log

| Date | Decision | Why |
| --- | --- | --- |
| 2026-10-02 | No quick-play toggle on public tables | A host who wants to vet players makes the table private. Two table types, not three. |
| 2026-10-02 | Forfeit carries the round on rather than re-dealing | Re-dealing let a player with nothing left to lose reset a knocked round for the whole table. |
| 2026-10-02 | Practice is a fixed four-seat table | An easier first screen. The ten-seat cap is tested on the greybox with a developer-only seat override and decided in slice 2. |

## Open questions

None at present.
