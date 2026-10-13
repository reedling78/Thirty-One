import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Link } from 'expo-router';
import { useEffect } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Felt } from '@/components/ui/Felt';
import { BACK_SWATCH, BUTTON, PANEL } from '@/theme/components';
import { Txt, setDevFontScale, useDevFontScale } from '@/theme/text';
import { color, radius, space, type BackColor } from '@/theme/tokens';
import { PRACTICE_SEATS, useDevSettings } from '@/settings/DevSettings';
import { useSettings } from '@/settings/Settings';

export default function SettingsScreen() {
  const { settings, update, motionReduced } = useSettings();
  const { seats, setSeats } = useDevSettings();
  const devScale = useDevFontScale();
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

        <BackPicker value={settings.backColor} onChange={(backColor) => update({ backColor })} />

        <Button size="sheet" label="Test sound and haptics" onPress={test} />
        <Txt variant="status" color={color.inkSecondary}>
          Sound plays through the silent switch. Haptics need “System Haptics” on in your phone’s
          Sounds & Haptics settings.
        </Txt>

        <View style={styles.section}>
          <Txt variant="title" color={color.ink}>
            Learning
          </Txt>
          <Link href="/practice?guided=1" asChild>
            <Button
              size="sheet"
              label={
                settings.guidedDone ? 'Replay the guided first game' : 'Play the guided first game'
              }
            />
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
            </View>
            <Txt variant="body" color={color.ink}>
              Text size: {devScale === null ? 'system' : `${devScale}×`}
            </Txt>
            <View style={styles.row}>
              {[null, 1, 1.3, 1.6].map((v) => (
                <Pressable
                  key={String(v)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: devScale === v }}
                  onPress={() => setDevFontScale(v)}
                  style={styles.small}
                >
                  <Txt variant="button" color={color.ink}>
                    {v === null ? 'System' : `${v}×`}
                  </Txt>
                </Pressable>
              ))}
            </View>
            <View style={styles.row}>
              <Link href="/dev-cards" asChild>
                <Pressable accessibilityRole="button" style={styles.small}>
                  <Txt variant="button" color={color.ink}>
                    Card sheet
                  </Txt>
                </Pressable>
              </Link>
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

const BACKS: { value: BackColor; name: string }[] = [
  { value: 'blue', name: 'Blue' },
  { value: 'red', name: 'Red' },
  { value: 'green', name: 'Green' },
  { value: 'black', name: 'Black' },
];
const LATTICE = require('../../assets/images/back/lattice-normal.png');

/** Card back: one pattern, four colourways, as back-shaped radio swatches. */
function BackPicker({ value, onChange }: { value: BackColor; onChange: (v: BackColor) => void }) {
  return (
    <View style={styles.backRow}>
      <View style={styles.settingText}>
        <Txt variant="label" color={color.ink}>
          Card back
        </Txt>
        <Txt variant="status" color={color.inkSecondary}>
          One pattern, four colours. Opponents’ cards and the deck use it.
        </Txt>
      </View>
      <View style={styles.swatches} accessibilityRole="radiogroup" accessibilityLabel="Card back">
        {BACKS.map((b) => {
          const checked = b.value === value;
          return (
            <Pressable
              key={b.value}
              accessibilityRole="radio"
              accessibilityState={{ checked }}
              accessibilityLabel={`${b.name} card back`}
              onPress={() => onChange(b.value)}
              style={styles.swatchItem}
            >
              <View style={[styles.swatchRing, checked && styles.swatchRingOn]}>
                <View style={styles.swatchStock}>
                  <ImageBackground
                    source={LATTICE}
                    resizeMode="repeat"
                    style={[styles.swatchPanel, { backgroundColor: color.back[b.value] }]}
                    imageStyle={styles.swatchTile}
                  />
                </View>
              </View>
              <Txt variant="status" color={color.ink}>
                {b.name}
              </Txt>
            </Pressable>
          );
        })}
      </View>
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
  dev: {
    borderWidth: 1,
    borderColor: color.rule,
    borderRadius: radius.card,
    padding: space.md,
    gap: space.sm,
    marginTop: space.lg,
  },
  row: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  backRow: {
    gap: space.md,
    paddingVertical: space.lg,
    borderBottomWidth: 1,
    borderColor: color.rule,
  },
  swatches: { flexDirection: 'row', gap: BACK_SWATCH.spacing, flexWrap: 'wrap' },
  swatchItem: { alignItems: 'center', gap: space.xs },
  swatchRing: {
    padding: BACK_SWATCH.gap,
    borderWidth: BACK_SWATCH.ring,
    borderColor: 'transparent',
    borderRadius: BACK_SWATCH.radius + BACK_SWATCH.gap + BACK_SWATCH.ring,
  },
  swatchRingOn: { borderColor: color.ink },
  swatchStock: {
    width: BACK_SWATCH.w,
    height: BACK_SWATCH.h,
    borderRadius: BACK_SWATCH.radius,
    borderWidth: 1,
    borderColor: color.back.black,
    backgroundColor: color.cardFace,
    padding: BACK_SWATCH.stock - 1,
  },
  swatchPanel: { flex: 1, borderRadius: 1, overflow: 'hidden' },
  swatchTile: { width: '100%', height: '100%' },
  small: {
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderWidth: BUTTON.border,
    borderColor: color.ink,
    borderRadius: radius.md,
  },
});
