import type { GameEvent } from '@thirtyone/rules';
import { setAudioModeAsync, useAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { useSettings, type Settings } from '@/settings/Settings';
import type { TableSnapshot } from './TableClient';

const SOUNDS = {
  deal: require('../../assets/sounds/deal.wav'),
  shuffle: require('../../assets/sounds/shuffle.wav'),
  yourturn: require('../../assets/sounds/yourturn.wav'),
  draw: require('../../assets/sounds/draw.wav'),
  discard: require('../../assets/sounds/discard.wav'),
  knock: require('../../assets/sounds/knock.wav'),
  fold: require('../../assets/sounds/fold.wav'),
  thirtyone: require('../../assets/sounds/thirtyone.wav'),
};
type Sound = keyof typeof SOUNDS;

/** Length of each file, so `yourturn` can wait for whatever sounded just before it. */
const DURATION_MS: Record<Sound, number> = {
  deal: 420,
  shuffle: 620,
  yourturn: 220,
  draw: 130,
  discard: 90,
  knock: 360,
  fold: 450,
  thirtyone: 750,
};

/** Your own moves at full volume; the bots' routine moves are texture only. */
const BOT_VOLUME = 0.35;
/** The knock haptic: two heavy raps, matching the sound. */
const KNOCK_RAP_GAP_MS = 150;
/** Settings › Test: your-turn cue, then the knock. */
const TEST_GAP_MS = 600;

type Players = Record<Sound, AudioPlayer>;

/** One player per file, created once. */
function usePlayers(): Players {
  // Games play through the silent switch; without this, iOS mutes every effect when the ringer is off.
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);
  return {
    deal: useAudioPlayer(SOUNDS.deal),
    shuffle: useAudioPlayer(SOUNDS.shuffle),
    yourturn: useAudioPlayer(SOUNDS.yourturn),
    draw: useAudioPlayer(SOUNDS.draw),
    discard: useAudioPlayer(SOUNDS.discard),
    knock: useAudioPlayer(SOUNDS.knock),
    fold: useAudioPlayer(SOUNDS.fold),
    thirtyone: useAudioPlayer(SOUNDS.thirtyone),
  };
}

/** Sound and haptic calls, each a no-op when its setting is off. */
function outputs(
  settings: Settings,
  players: Players,
  later: (fn: () => void, ms: number) => void,
) {
  const play = (s: Sound, volume = 1) => {
    if (!settings.sound) return;
    const p = players[s];
    try {
      p.volume = volume;
      p.seekTo(0);
      p.play();
    } catch {
      // A player that has not finished loading throws; the next event will play.
    }
  };
  const buzz = (fn: () => Promise<void>) => {
    if (settings.haptics) fn().catch(() => {});
  };
  const impact = (style: Haptics.ImpactFeedbackStyle) => buzz(() => Haptics.impactAsync(style));
  const notify = (type: Haptics.NotificationFeedbackType) =>
    buzz(() => Haptics.notificationAsync(type));
  const select = () => buzz(() => Haptics.selectionAsync());
  const knock = () => {
    play('knock');
    impact(Haptics.ImpactFeedbackStyle.Heavy);
    later(() => impact(Haptics.ImpactFeedbackStyle.Heavy), KNOCK_RAP_GAP_MS);
  };
  const yourTurn = () => {
    play('yourturn');
    impact(Haptics.ImpactFeedbackStyle.Medium);
  };
  return { play, impact, notify, select, knock, yourTurn };
}

/** setTimeout that is cleared when the component unmounts. */
function useLater() {
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);
  return (fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
  };
}

/**
 * Sounds and haptics for table events, per Feedback Spec.md: you hear and
 * feel what you do and what happens to you; the bots' draws and discards are
 * quiet texture; one sound per moment. Sound and Haptics settings gate
 * everything.
 */
export function useFeedback(snapshot: TableSnapshot | null) {
  const { settings } = useSettings();
  const players = usePlayers();
  const later = useLater();

  useEffect(() => {
    if (!snapshot || snapshot.events.length === 0) return;
    const { view } = snapshot;
    const me = view.seat;
    const out = outputs(settings, players, later);
    const events = snapshot.events as readonly GameEvent[];
    // One sound per moment. A mid-round reshuffle arrives with the draw that emptied
    // the deck, and the reveal with the draw or discard that ended the round (a 31,
    // or the last turn after a knock): the shuffle or the reveal plays instead.
    const cardSoundTaken = events.some((e) => e.type === 'reshuffled' || e.type === 'roundOver');
    // How long the sounds already started in this snapshot run, so `yourturn` waits for them.
    let busyMs = 0;
    const sound = (s: Sound, volume = 1) => {
      out.play(s, volume);
      busyMs = Math.max(busyMs, DURATION_MS[s]);
    };

    for (const e of events) {
      switch (e.type) {
        case 'roundStarted':
          sound('deal');
          break;
        case 'reshuffled':
          sound('shuffle');
          break;
        case 'drew':
          if (!cardSoundTaken) sound('draw', e.seat === me ? 1 : BOT_VOLUME);
          if (e.seat === me) out.select();
          break;
        case 'discarded':
          if (!cardSoundTaken) sound('discard', e.seat === me ? 1 : BOT_VOLUME);
          if (e.seat === me) out.select();
          break;
        case 'knocked':
          out.knock();
          busyMs = Math.max(busyMs, DURATION_MS.knock);
          break;
        case 'roundOver': {
          // The reveal plays exactly one of thirtyone / fold, in that order, with the
          // haptic for what it costs you. A 31 dealt outright arrives with the deal:
          // the reveal waits for it.
          const reveal = () => {
            if (e.reason === 'thirtyOne') out.play('thirtyone');
            else if (e.penalties.length > 0) out.play('fold');
            const mine = e.penalties.find((p) => p.seat === me);
            if (mine) {
              const folds = view.seats[me]?.folds ?? 0;
              const lastLife = folds + mine.corners > 4;
              out.notify(
                mine.corners >= 2 || lastLife
                  ? Haptics.NotificationFeedbackType.Error
                  : Haptics.NotificationFeedbackType.Warning,
              );
            } else if (e.reason === 'thirtyOne') {
              out.notify(Haptics.NotificationFeedbackType.Success);
            } else if (e.penalties.length > 0) {
              out.impact(
                e.penalties.some((p) => p.corners >= 2)
                  ? Haptics.ImpactFeedbackStyle.Medium
                  : Haptics.ImpactFeedbackStyle.Light,
              );
            }
          };
          if (busyMs > 0) later(reveal, busyMs);
          else reveal();
          break;
        }
        case 'gameWon':
          // On entering Results. Losing was already marked at the reveal that put you out.
          if (e.seat === me) {
            sound('thirtyone');
            out.notify(Haptics.NotificationFeedbackType.Success);
          }
          break;
        case 'turnChanged':
          // The one "look here" cue, after whatever is already sounding (the deal, a bot's knock or discard).
          if (e.seat === me) {
            if (busyMs > 0) later(out.yourTurn, busyMs);
            else out.yourTurn();
          }
          break;
        default:
          break;
      }
    }
    // Only react to new snapshots; the players and settings are stable between them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot]);
}

/** Settings › "Test sound and haptics": the your-turn cue, then the knock, 600 ms apart. */
export function useFeedbackTest(): () => void {
  const { settings } = useSettings();
  const players = usePlayers();
  const later = useLater();
  return () => {
    const out = outputs(settings, players, later);
    out.yourTurn();
    later(out.knock, TEST_GAP_MS);
  };
}
