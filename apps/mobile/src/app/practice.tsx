import { easyBot, normalBot } from '@thirtyone/bots';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Felt } from '@/components/ui/Felt';
import { GreyboxTable } from '@/components/greybox/GreyboxTable';
import { GuideOverlay } from '@/components/greybox/GuideOverlay';
import { Results } from '@/components/greybox/Results';
import {
  GUIDED_DEALER,
  GUIDED_DECK,
  GUIDED_SEATS,
  guideStepFor,
  type GuideStepId,
} from '@/game/guide';
import { LocalTableClient } from '@/game/LocalTableClient';
import { useFeedback } from '@/game/useFeedback';
import { useTable } from '@/game/useTable';
import { useDevSettings } from '@/settings/DevSettings';
import { useSettings } from '@/settings/Settings';
import { Txt } from '@/theme/text';
import { color } from '@/theme/tokens';

export default function PracticeScreen() {
  const router = useRouter();
  const { guided: guidedParam, seats: seatsParam } = useLocalSearchParams<{
    guided?: string;
    seats?: string;
  }>();
  const guided = guidedParam === '1';
  const { seats: devSeats } = useDevSettings();
  // Dev builds also take ?seats=N, so the 2–10 seat layouts can be opened directly.
  const seats =
    __DEV__ && seatsParam ? Math.min(10, Math.max(2, Number(seatsParam) || devSeats)) : devSeats;
  const { update } = useSettings();
  const [gameNumber, setGameNumber] = useState(0);
  const [dismissed, setDismissed] = useState<ReadonlySet<GuideStepId>>(() => new Set());
  const [guideActive, setGuideActive] = useState(guided);

  // A new client per game; useTable starts it and disposes it on unmount.
  const client = useMemo(
    () =>
      guided && gameNumber === 0
        ? new LocalTableClient({
            seats: GUIDED_SEATS,
            bots: [easyBot],
            dealer: GUIDED_DEALER,
            firstDeck: GUIDED_DECK,
            seed: 31,
          })
        : new LocalTableClient({ seats, bots: [normalBot, easyBot, normalBot] }),
    [seats, gameNumber, guided],
  );
  const { snapshot, log, eliminated, lastActions } = useTable(client, 7);
  useFeedback(snapshot);

  if (!snapshot) {
    return (
      <Felt style={styles.center}>
        <Txt variant="title" color={color.onBaize}>
          Dealing…
        </Txt>
      </Felt>
    );
  }

  if (snapshot.view.phase === 'gameOver') {
    return (
      <Felt>
        <SafeAreaView style={styles.safe} edges={['bottom']}>
          <Results
            view={snapshot.view}
            eliminationOrder={eliminated}
            onPlayAgain={() => setGameNumber((n) => n + 1)}
            onHome={() => router.replace('/')}
          />
        </SafeAreaView>
      </Felt>
    );
  }

  const step = guideActive ? guideStepFor(snapshot.view) : null;
  const visibleStep = step && !dismissed.has(step.id) ? step : null;
  const finishGuide = () => {
    setGuideActive(false);
    update({ guidedDone: true });
  };

  const round = snapshot.view.round;
  const title = `${guideActive ? 'Guided game' : 'Practice'}${round > 0 ? ` · Round ${round}` : ''}`;
  return (
    <Felt>
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <Stack.Screen options={{ title }} />
        <GreyboxTable client={client} view={snapshot.view} log={log} lastActions={lastActions} />
        {visibleStep ? (
          <GuideOverlay
            step={visibleStep}
            onDismiss={() => {
              setDismissed((prev) => new Set(prev).add(visibleStep.id));
              if (visibleStep.id === 'done') finishGuide();
            }}
            onSkip={finishGuide}
          />
        ) : null}
      </SafeAreaView>
    </Felt>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
});
