import { Link } from 'expo-router';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { PRACTICE_SEATS, useDevSettings } from '@/settings/DevSettings';
import { useSettings } from '@/settings/Settings';

export default function SettingsScreen() {
  const { settings, update, motionReduced } = useSettings();
  const { seats, setSeats } = useDevSettings();

  return (
    <View style={styles.root}>
      <Row
        label="Sound"
        detail="Deal, draw, knock and fold"
        value={settings.sound}
        onChange={(sound) => update({ sound })}
      />
      <Row
        label="Haptics"
        detail="A tap when it's your turn and when someone knocks"
        value={settings.haptics}
        onChange={(haptics) => update({ haptics })}
      />
      <Row
        label="Reduce motion"
        detail={
          motionReduced && !settings.reduceMotion
            ? 'On, from your phone’s accessibility settings'
            : 'Skip the deal and reveal animations'
        }
        value={settings.reduceMotion}
        onChange={(reduceMotion) => update({ reduceMotion })}
      />

      <View style={styles.section}>
        <Text style={styles.h}>Learning</Text>
        <Link href="/practice?guided=1" asChild>
          <Pressable accessibilityRole="button" style={styles.button}>
            <Text style={styles.buttonText}>
              {settings.guidedDone ? 'Replay the guided first game' : 'Play the guided first game'}
            </Text>
          </Pressable>
        </Link>
      </View>

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
              style={styles.small}
            >
              <Text style={styles.buttonText}>−</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="More seats"
              onPress={() => setSeats(seats + 1)}
              style={styles.small}
            >
              <Text style={styles.buttonText}>+</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setSeats(PRACTICE_SEATS)}
              style={styles.small}
            >
              <Text style={styles.buttonText}>Reset</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => update({ guidedDone: false })}
              style={styles.small}
            >
              <Text style={styles.buttonText}>Reset guide</Text>
            </Pressable>
          </View>
          <Text style={styles.hint}>
            Dev-only. Lets the 2–10 seat layouts be checked on a real phone.
          </Text>
        </View>
      )}
    </View>
  );
}

function Row({
  label,
  detail,
  value,
  onChange,
}: {
  label: string;
  detail: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View
      style={styles.setting}
      accessible
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={`${label}. ${detail}`}
    >
      <View style={styles.settingText}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { padding: 20, gap: 14 },
  setting: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingText: { flex: 1, gap: 2 },
  label: { fontSize: 16, fontWeight: '600' },
  detail: { fontSize: 13, color: '#555' },
  section: { gap: 8, marginTop: 8 },
  h: { fontWeight: '700', fontSize: 16 },
  p: { fontSize: 16 },
  hint: { fontSize: 12, color: '#555' },
  button: {
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { fontWeight: '700', fontSize: 15 },
  dev: { borderWidth: 1, borderColor: '#999', borderRadius: 8, padding: 12, gap: 8, marginTop: 16 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  small: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 6,
  },
});
