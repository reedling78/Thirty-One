import type { Card } from '@thirtyone/rules';
import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CardView } from '@/components/greybox/CardView';
import { Button } from '@/components/ui/Button';
import { Felt } from '@/components/ui/Felt';
import { useSettings } from '@/settings/Settings';
import { SIZE } from '@/theme/cardArt';
import { HOME } from '@/theme/components';
import { Txt } from '@/theme/text';
import { color, shadow, space } from '@/theme/tokens';

const FAN: readonly Card[] = [
  { rank: 'A', suit: 'spades' },
  { rank: 'K', suit: 'spades' },
  { rank: '10', suit: 'spades' },
];

/** Signed-out home: bare felt, cream type, three stacked buttons. */
export default function HomeScreen() {
  const { settings } = useSettings();
  const practiceHref = settings.guidedDone ? '/practice' : '/practice?guided=1';
  return (
    <Felt>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.top}>
          <View
            style={styles.fan}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {FAN.map((card, i) => (
              <View key={card.rank} style={[styles.fanCard, HOME.fan[i]]}>
                <CardView card={card} size="normal" />
              </View>
            ))}
          </View>
          <Txt variant="display" color={color.onBaize} accessibilityRole="header">
            ThirtyOne
          </Txt>
          <Txt variant="body" color={color.onBaizeSecondary} style={styles.tagline}>
            Build the best three-card hand. Knock when you dare. Don’t end up on the bus.
          </Txt>
        </View>
        <View style={styles.buttons}>
          <Link href={practiceHref} asChild>
            <Button
              variant="primary"
              ground="baize"
              size="hero"
              label={settings.guidedDone ? 'Play practice' : 'Learn to play'}
            />
          </Link>
          <Link href="/rules" asChild>
            <Button ground="baize" size="hero" label="How to play" />
          </Link>
          <Link href="/settings" asChild>
            <Button ground="baize" size="hero" label="Settings" />
          </Link>
        </View>
      </SafeAreaView>
    </Felt>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: space.xxl,
    paddingTop: space.xxxl,
    paddingBottom: space.xxl,
  },
  top: { gap: space.lg },
  fan: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: space.xs },
  fanCard: { borderRadius: SIZE.normal.radius, ...shadow.lifted },
  tagline: { maxWidth: HOME.taglineWidth },
  buttons: { gap: space.md },
});
