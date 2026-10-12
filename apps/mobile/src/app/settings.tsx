import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Link } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Felt } from '@/components/ui/Felt';
import { BUTTON, PANEL } from '@/theme/components';
import { Txt } from '@/theme/text';
import { color, radius, space } from '@/theme/tokens';
import { PRACTICE_SEATS, useDevSettings } from '@/settings/DevSettings';
import { useSettings } from '@/settings/Settings';

export default function SettingsScreen() {
  const { settings, update, motionReduced } = useSettings();
  const { seats, setSeats } = useDevSettings();
  const knock = useAudioPlayer(require('../../assets/sounds/knock.wav'));
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);
  const test = () => {
    try {
      knock.seekTo(0);
      knock.play();
    } catch {
      // not loaded yet
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  };

  return (
    <Felt pool={false}>
      <ScrollView style={styles.sheet} contentContainerStyle={styles.root}>
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

        <Pressable accessibilityRole="button" onPress={test} style={styles.button}>
          <Txt variant="button" color={color.ink}>
            Test sound and haptics
          </Txt>
        </Pressable>
        <Txt variant="status" color={color.inkSecondary}>
          Sound plays through the silent switch. Haptics need “System Haptics” on in your phone’s
          Sounds & Haptics settings.
        </Txt>

        <View style={styles.section}>
          <Txt variant="title" color={color.ink}>
            Learning
          </Txt>
          <Link href="/practice?guided=1" asChild>
            <Pressable accessibilityRole="button" style={styles.button}>
              <Txt variant="button" color={color.ink}>
                {settings.guidedDone
                  ? 'Replay the guided first game'
                  : 'Play the guided first game'}
              </Txt>
            </Pressable>
          </Link>
        </View>

        {__DEV__ && (
          <View style={styles.dev}>
            <Txt variant="title" color={color.ink}>
              Developer
            </Txt>
            <Txt variant="body" color={color.ink}>
              Practice table seats: {seats} {seats === PRACTICE_SEATS ? '(default)' : ''}
            </Txt>
            <View style={styles.row}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fewer seats"
                onPress={() => setSeats(seats - 1)}
                style={styles.small}
              >
                <Txt variant="button" color={color.ink}>
                  −
                </Txt>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="More seats"
                onPress={() => setSeats(seats + 1)}
                style={styles.small}
              >
                <Txt variant="button" color={color.ink}>
                  +
                </Txt>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setSeats(PRACTICE_SEATS)}
                style={styles.small}
              >
                <Txt variant="button" color={color.ink}>
                  Reset
                </Txt>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => update({ guidedDone: false })}
                style={styles.small}
              >
                <Txt variant="button" color={color.ink}>
                  Reset guide
                </Txt>
              </Pressable>
            </View>
            <Txt variant="status" color={color.inkSecondary}>
              Dev-only. Lets the 2–10 seat layouts be checked on a real phone.
            </Txt>
          </View>
        )}
      </ScrollView>
    </Felt>
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
        <Txt variant="label" color={color.ink}>
          {label}
        </Txt>
        <Txt variant="status" color={color.inkSecondary}>
          {detail}
        </Txt>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: color.ink, false: color.rule }}
        thumbColor={color.cardFace}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    marginTop: space.sm,
    marginHorizontal: PANEL.gutter,
    backgroundColor: color.paper,
    borderTopLeftRadius: radius.panel,
    borderTopRightRadius: radius.panel,
  },
  root: { padding: space.lg, gap: space.md, paddingBottom: space.xxxl },
  setting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingVertical: space.lg,
    borderBottomWidth: 1,
    borderColor: color.rule,
  },
  settingText: { flex: 1, gap: 3 },
  section: { gap: space.sm, marginTop: space.sm },
  button: {
    minHeight: BUTTON.height.sheet,
    justifyContent: 'center',
    borderWidth: BUTTON.border,
    borderColor: color.ink,
    borderRadius: radius.panel,
    alignItems: 'center',
  },
  dev: {
    borderWidth: 1,
    borderColor: color.rule,
    borderRadius: radius.card,
    padding: space.md,
    gap: space.sm,
    marginTop: space.lg,
  },
  row: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  small: {
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderWidth: BUTTON.border,
    borderColor: color.ink,
    borderRadius: radius.md,
  },
});
