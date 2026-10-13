# ThirtyOne — Sound and haptics spec

Companion to [[Design]]. Files live in [`apps/mobile/assets/sounds/`](../../apps/mobile/assets/sounds/) (they replaced the greybox set; `discard`, `shuffle`, `yourturn`, `thirtyone` were new). All 44.1 kHz mono 16-bit, peak −3 dBFS, under 0.8 s.

## Principles

- **Feedback follows attention.** You hear and feel what *you* do and what *happens to you*. Bots' routine moves are nearly silent so their turns don't become a run of clicks.
- **One sound per moment, never two.** A knock plays the knock, not the knock plus a discard. The reveal plays the fold or the 31, not both.
- **Haptics are for the hand, sound is for the table.** Haptics confirm touch (your draw, your discard) and flag the moments that need you (your turn, a knock). Sound carries texture (cards on felt) and the two events that deserve a voice (knock, 31).
- **Settings are respected literally.** Sound off → no audio ever; Haptics off → no haptics ever; Reduce motion changes nothing here.

## The vocabulary

| Moment | Sound | Haptic | Notes |
| --- | --- | --- | --- |
| Round dealt | `deal` (riffle of three) | — | Once per round. |
| Between rounds (shuffle) | `shuffle` (quiet, 0.6 s) | — | Only if the deck is actually reshuffled. |
| Your turn begins | `yourturn` (soft wood tick) | `impactAsync(Medium)` | The one "look here" cue. Fires with the header band turning gold. |
| You draw (deck or discard) | `draw` (card slide) | `selectionAsync()` | Confirms the tap. |
| You discard | `discard` (card snap) | `selectionAsync()` | Confirms the tap. |
| A bot draws | `draw` at 35% volume | — | Texture only. |
| A bot discards | `discard` at 35% volume | — | Texture only. |
| Anyone knocks | `knock` (two wooden raps) | two `impactAsync(Heavy)` 150 ms apart | Matches the sound's rhythm. Fires with the KNOCKED! stamp. |
| Reveal — someone folds | `fold` (thud + falling two-note) | `notificationAsync(Warning)` only if **you** folded; `impactAsync(Light)` otherwise | One `fold` even if several fold. |
| Reveal — double fold | `fold` | `notificationAsync(Error)` if you; `impactAsync(Medium)` otherwise | Same sound; the haptic is the difference. |
| Anyone hits 31 | `thirtyone` (three rising bells) | `notificationAsync(Success)` | Replaces `fold` at that reveal. Fires with the THIRTY ONE! stamp. |
| KNOCK / Deal button tap | — | `selectionAsync()` | Button feel; the event that follows makes the sound. |
| You lose your last life (OUT) | `fold` | `notificationAsync(Error)` | Then the Results screen; no extra sound there. |
| You win the game | `thirtyone` | `notificationAsync(Success)` | On entering Results. |

## Implementation notes

- Keep one `AudioPlayer` per file, created once, `seekTo(0)` then `play()`; set `volume` per call (1.0 for you, 0.35 for bots).
- Fire haptics from the same effect that handles the event; the double knock is two calls with a 150 ms `setTimeout`.
- The reveal arrives as one `roundOver` event: play exactly one of `thirtyone` / `fold`, decided in that order, and derive the haptic from whether `penalties` includes the player's seat and how many lives it costs.
- `turnChanged` to the player's seat is the only place `yourturn` plays. Do not play it on the first turn after a deal if the deal sound is still sounding — wait for `deal` to finish (it is 0.42 s) or skip it.
- "Test sound and haptics" in Settings plays `yourturn` + Medium impact, then `knock` + its double Heavy, 600 ms apart.
