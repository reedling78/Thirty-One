import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { DEALER, PILL, PLAYING_MARK } from '@/theme/components';
import { Txt } from '@/theme/text';
import { color, radius, type as typeTokens } from '@/theme/tokens';

/** The dealer button: a small white disc with a D, poker style. Fixed size. */
export function DealerButton() {
  return (
    <View style={styles.dealer} accessible accessibilityRole="image" accessibilityLabel="Dealer">
      <Text allowFontScaling={false} style={styles.dealerText}>
        D
      </Text>
    </View>
  );
}

/** High-contrast all-caps pill after a name, e.g. KNOCKED. */
export function Pill({ children }: { children: string }) {
  return (
    <View style={styles.pill}>
      <Txt variant="pill" color={color.paper}>
        {children}
      </Txt>
    </View>
  );
}

/** The ▶ that leads "Playing now": the shape half of the active state. Decorative. */
export function PlayingMark({ tint = color.ink }: { tint?: string }) {
  const s = PLAYING_MARK;
  return (
    <Svg
      width={s.size}
      height={s.size}
      viewBox={`0 0 ${s.viewBox} ${s.viewBox}`}
      style={{ marginRight: s.gap }}
    >
      <Path d={s.path} fill={tint} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  dealer: {
    width: DEALER.size,
    height: DEALER.size,
    borderRadius: DEALER.size / 2,
    borderWidth: 1,
    borderColor: DEALER.border,
    backgroundColor: DEALER.face,
    alignItems: 'center',
    justifyContent: 'center',
    ...DEALER.shadow,
  },
  dealerText: {
    fontFamily: typeTokens.score.family,
    fontSize: DEALER.font,
    lineHeight: DEALER.font + 2,
    color: color.ink,
    includeFontPadding: false,
  },
  pill: {
    minHeight: PILL.height,
    justifyContent: 'center',
    paddingHorizontal: PILL.padH,
    borderRadius: radius.pill,
    backgroundColor: color.ink,
  },
});
