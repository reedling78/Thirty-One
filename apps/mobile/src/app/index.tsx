import { Link } from 'expo-router';
import { useSettings } from '@/settings/Settings';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Felt } from '@/components/ui/Felt';
import { BUTTON } from '@/theme/components';
import { Txt } from '@/theme/text';
import { color, radius, space } from '@/theme/tokens';

/** Signed-out home. Practice is the whole app in slice 1. */
export default function HomeScreen() {
  const { settings } = useSettings();
  const practiceHref = settings.guidedDone ? '/practice' : '/practice?guided=1';
  return (
    <Felt>
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.root}>
          <Txt
            variant="display"
            color={color.onBaize}
            style={styles.title}
            accessibilityRole="header"
          >
            ThirtyOne
          </Txt>
          <Txt variant="body" color={color.onBaizeSecondary} style={styles.tagline}>
            Build the best three-card hand. Knock when you dare. Don’t end up on the bus.
          </Txt>
          <Link href={practiceHref} asChild>
            <Pressable accessibilityRole="button" style={styles.primaryButton}>
              <Txt variant="button" color={color.paper}>
                {settings.guidedDone ? 'Play practice' : 'Learn to play'}
              </Txt>
            </Pressable>
          </Link>
          <Link href="/rules" asChild>
            <Pressable accessibilityRole="button" style={styles.button}>
              <Txt variant="button" color={color.onBaize}>
                How to play
              </Txt>
            </Pressable>
          </Link>
          <Link href="/settings" asChild>
            <Pressable accessibilityRole="button" style={styles.button}>
              <Txt variant="button" color={color.onBaize}>
                Settings
              </Txt>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    </Felt>
  );
}

// Link asChild forbids array styles on its child, so each button style is one flat object.
const styles = StyleSheet.create({
  safe: { flex: 1 },
  root: { flex: 1, padding: space.xxl, gap: space.lg, justifyContent: 'center' },
  title: { textAlign: 'center' },
  tagline: { textAlign: 'center', marginBottom: space.lg },
  button: {
    minHeight: BUTTON.height.hero,
    justifyContent: 'center',
    borderWidth: BUTTON.border,
    borderColor: color.onBaize,
    borderRadius: radius.panel,
    alignItems: 'center',
  },
  primaryButton: {
    minHeight: BUTTON.height.hero,
    justifyContent: 'center',
    borderWidth: BUTTON.border,
    borderColor: color.ink,
    borderRadius: radius.panel,
    alignItems: 'center',
    backgroundColor: color.ink,
  },
});
