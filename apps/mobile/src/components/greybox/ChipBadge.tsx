import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { CHIP } from '@/theme/components';
import { color, type as typeTokens } from '@/theme/tokens';

interface Props {
  /** Corners folded so far, 0–4. */
  folds: number;
  out?: boolean;
  /** 32 on rows, 36 in the player's panel. */
  size?: number;
}

const TONES = {
  plain: { fill: color.chip.face, edge: color.chip.ring, ring: color.chip.ring, text: color.ink },
  bus: {
    fill: color.chip.busFace,
    edge: color.chip.busFace,
    ring: color.chip.busRing,
    text: color.chip.busRing,
  },
  out: {
    fill: color.chip.outFace,
    edge: color.chip.outRing,
    ring: color.chip.outRing,
    text: color.chip.outText,
  },
} as const;

/**
 * A poker chip showing how many corners a player has left: eight edge notches,
 * a dashed inner ring, the count in the middle. Four to start; at zero they are
 * on the bus — the chip inverts to ink and reads BUS — and one more loss is OUT,
 * dimmed. The number is a text layer over the ring. Chips never text-scale.
 */
export function ChipBadge({ folds, out, size = CHIP.size.row }: Props) {
  const left = Math.max(0, 4 - folds);
  const onBus = !out && left === 0;
  const text = out ? 'OUT' : onBus ? 'BUS' : String(left);
  const label = out
    ? 'Out of the game'
    : onBus
      ? 'On the bus: one more loss and out'
      : `${left} of 4 corners left`;
  const tone = TONES[out ? 'out' : onBus ? 'bus' : 'plain'];
  const fonts = size > CHIP.size.row ? CHIP.font.panel : CHIP.font.row;
  const word = text.length > 1;
  const c = CHIP.viewBox / 2;
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${CHIP.viewBox} ${CHIP.viewBox}`}>
        <Circle
          cx={c}
          cy={c}
          r={CHIP.edge.r}
          fill={tone.fill}
          stroke={tone.edge}
          strokeWidth={CHIP.edge.width}
        />
        <Circle
          cx={c}
          cy={c}
          r={CHIP.notches.r}
          fill="none"
          stroke={tone.ring}
          strokeWidth={CHIP.notches.width}
          strokeDasharray={CHIP.notches.dash.join(' ')}
        />
        <Circle
          cx={c}
          cy={c}
          r={CHIP.inner.r}
          fill="none"
          stroke={tone.ring}
          strokeWidth={CHIP.inner.width}
          strokeDasharray={CHIP.inner.dash.join(' ')}
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text
          allowFontScaling={false}
          style={[
            styles.text,
            {
              color: tone.text,
              fontSize: word ? fonts.word : fonts.number,
              lineHeight: (word ? fonts.word : fonts.number) + 2,
              letterSpacing: word ? CHIP.wordLetterSpacing : 0,
            },
          ]}
        >
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: typeTokens.score.family, includeFontPadding: false },
});
