import type { GameEvent } from '@thirtyone/rules';
import { useAudioPlayer } from 'expo-audio';
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
 * Sound: deal, draw, knock, fold. Haptics: your turn, a knock, a 31.
 */
export function useFeedback(snapshot: TableSnapshot | null) {
  const { settings } = useSettings();
  const deal = useAudioPlayer(SOUNDS.deal);
  const draw = useAudioPlayer(SOUNDS.draw);
  const knock = useAudioPlayer(SOUNDS.knock);
  const fold = useAudioPlayer(SOUNDS.fold);

  useEffect(() => {
    if (!snapshot || snapshot.events.length === 0) return;
    const me = snapshot.view.seat;
    const play = (p: typeof deal) => {
      if (!settings.sound) return;
      p.seekTo(0);
      p.play();
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
        case 'folded':
          play(fold);
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
