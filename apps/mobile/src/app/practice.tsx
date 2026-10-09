import { easyBot, normalBot } from '@thirtyone/bots';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GreyboxTable } from '@/components/greybox/GreyboxTable';
import { Results } from '@/components/greybox/Results';
import { LocalTableClient } from '@/game/LocalTableClient';
import { useTable } from '@/game/useTable';
import { useDevSettings } from '@/settings/DevSettings';

export default function PracticeScreen() {
  const router = useRouter();
  const { seats } = useDevSettings();
  const [gameNumber, setGameNumber] = useState(0);

  // A new client per game; useTable starts it and disposes it on unmount.
  const client = useMemo(
    () => new LocalTableClient({ seats, bots: [normalBot, easyBot, normalBot] }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seats, gameNumber],
  );
  const { snapshot, log, eliminated } = useTable(client);

  if (!snapshot) {
    return (
      <View style={styles.center}>
        <Text>Dealing…</Text>
      </View>
    );
  }

  if (snapshot.view.phase === 'gameOver') {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <Results
          view={snapshot.view}
          eliminationOrder={eliminated}
          onPlayAgain={() => setGameNumber((n) => n + 1)}
          onHome={() => router.replace('/')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <GreyboxTable client={client} view={snapshot.view} log={log} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
