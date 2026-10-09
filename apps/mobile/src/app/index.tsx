import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Signed-out home. Practice is the whole app in slice 1. */
export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.root}>
        <Text style={styles.title} accessibilityRole="header">
          ThirtyOne
        </Text>
        <Text style={styles.tagline}>
          Build the best three-card hand. Knock when you dare. Don’t end up on the bus.
        </Text>
        <Link href="/practice" asChild>
          <Pressable accessibilityRole="button" style={[styles.button, styles.primary]}>
            <Text style={[styles.buttonText, styles.primaryText]}>Play practice</Text>
          </Pressable>
        </Link>
        <Link href="/rules" asChild>
          <Pressable accessibilityRole="button" style={styles.button}>
            <Text style={styles.buttonText}>How to play</Text>
          </Pressable>
        </Link>
        <Link href="/settings" asChild>
          <Pressable accessibilityRole="button" style={styles.button}>
            <Text style={styles.buttonText}>Settings</Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  root: { flex: 1, padding: 24, gap: 16, justifyContent: 'center' },
  title: { fontSize: 40, fontWeight: '800', textAlign: 'center' },
  tagline: { textAlign: 'center', marginBottom: 16 },
  button: {
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 8,
    alignItems: 'center',
  },
  primary: { backgroundColor: '#000' },
  buttonText: { fontSize: 18, fontWeight: '700' },
  primaryText: { color: '#fff' },
});
