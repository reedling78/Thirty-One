import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PRACTICE_SEATS, useDevSettings } from '@/settings/DevSettings';

/** Real settings (sound, haptics, reduced motion) arrive in Milestone 6. */
export default function SettingsScreen() {
  const { seats, setSeats } = useDevSettings();
  return (
    <View style={styles.root}>
      <Text style={styles.p}>Sound, haptics and motion settings are coming.</Text>
      {__DEV__ && (
        <View style={styles.dev}>
          <Text style={styles.h}>Developer</Text>
          <Text style={styles.p}>
            Practice table seats: {seats} {seats === PRACTICE_SEATS ? '(default)' : ''}
          </Text>
          <View style={styles.row}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fewer seats"
              onPress={() => setSeats(seats - 1)}
              style={styles.button}
            >
              <Text style={styles.buttonText}>−</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="More seats"
              onPress={() => setSeats(seats + 1)}
              style={styles.button}
            >
              <Text style={styles.buttonText}>+</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setSeats(PRACTICE_SEATS)}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Reset</Text>
            </Pressable>
          </View>
          <Text style={styles.small}>
            Dev-only. Lets the 2–10 seat layouts be checked on a real phone.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { padding: 20, gap: 16 },
  dev: { borderWidth: 1, borderColor: '#999', borderRadius: 8, padding: 12, gap: 8 },
  h: { fontWeight: '700', fontSize: 16 },
  p: { fontSize: 16 },
  small: { fontSize: 12, color: '#555' },
  row: { flexDirection: 'row', gap: 8 },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 6,
  },
  buttonText: { fontWeight: '700', fontSize: 16 },
});
