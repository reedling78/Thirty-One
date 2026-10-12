import type { GameEvent } from '@thirtyone/rules';
import { setAudioModeAsync, useAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { useSettings } from '@/settings/Settings';
import type { TableSnapshot } from './TableClient';

const SOUNDS = {
  deal: require('../../assets/sounds/deal.wav'),
  draw: require('../../assets/sounds/draw.wav'),
  knock: require('../../assets/sounds/knock.wav'),
  fold: require('../../assets/sounds/fold.wav'),
};

/**
 * Sounds and haptics for table events, gated by the player's settings.
 * Sound: deal, draw, knock, fold. Haptics: your turn, a knock, a fold, a 31.
 * The knock and fold fire with their row callouts: a knock when it happens, a
 * fold at the reveal, when the penalties are known.
 */
export function useFeedback(snapshot: TableSnapshot | null) {
  const { settings } = useSettings();

  // Games play through the silent switch; without this, iOS mutes every effect when the ringer is off.
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  const deal = useAudioPlayer(SOUNDS.deal);
  const draw = useAudioPlayer(SOUNDS.draw);
  const knock = useAudioPlayer(SOUNDS.knock);
  const fold = useAudioPlayer(SOUNDS.fold);

  useEffect(() => {
    if (!snapshot || snapshot.events.length === 0) return;
    const me = snapshot.view.seat;
    const play = (p: AudioPlayer) => {
      if (!settings.sound) return;
      try {
        p.seekTo(0);
        p.play();
      } catch {
        // A player that has not finished loading throws; the next event will play.
      }
    };
    const buzz = (fn: () => Promise<void>) => {
      if (settings.haptics) fn().catch(() => {});
    };
    for (const e of snapshot.events as readonly GameEvent[]) {
      switch (e.type) {
        case 'roundStarted':
          play(deal);
          break;
        case 'drew':
          play(draw);
          break;
        case 'knocked':
          play(knock);
          buzz(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
          break;
        case 'thirtyOne':
          buzz(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
          break;
        case 'roundOver':
          if (e.penalties.length > 0) {
            play(fold);
            buzz(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
          }
          break;
        case 'turnChanged':
          if (e.seat === me) buzz(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
          break;
        default:
          break;
      }
    }
    // Only react to new snapshots; the players and settings are stable between them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot]);
}
