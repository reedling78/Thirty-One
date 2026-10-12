import { StyleSheet, Text, View } from 'react-native';
import { color, type as typeTokens } from '@/theme/tokens';

interface Props {
  /** Corners folded so far, 0–4. */
  folds: number;
  out?: boolean;
  size?: number;
}

/**
 * A poker chip showing how many corners a player has left. Four to start; at
 * zero they are on the bus — one more loss and they are out.
 */
export function ChipBadge({ folds, out, size = 44 }: Props) {
  const left = Math.max(0, 4 - folds);
  const onBus = !out && left === 0;
  const text = out ? 'OUT' : onBus ? 'BUS' : String(left);
  const label = out
    ? 'Out of the game'
    : onBus
      ? 'On the bus: one more loss and out'
      : `${left} of 4 corners left`;
  const ring = size * 0.78;
  const tone = out ? OUT : onBus ? BUS : PLAIN;
  return (
    <View
      accessible
      accessibilityLabel={label}
      style={[
        styles.chip,
        { width: size, height: size, borderRadius: size / 2 },
        { backgroundColor: tone.face, borderColor: tone.ring },
      ]}
    >
      <View
        style={[
          styles.ring,
          { width: ring, height: ring, borderRadius: ring / 2, borderColor: tone.ring },
        ]}
      />
      <Text
        allowFontScaling={false}
        style={[
          styles.text,
          { color: tone.text, fontSize: text.length > 1 ? size * 0.28 : size * 0.45 },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const PLAIN = { face: color.chip.face, ring: color.chip.ring, text: color.chip.ring };
const BUS = { face: color.chip.busFace, ring: color.chip.busRing, text: color.chip.busRing };
const OUT = { face: color.chip.outFace, ring: color.chip.outRing, text: color.chip.outText };

const styles = StyleSheet.create({
  chip: { alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  ring: { position: 'absolute', borderWidth: 2, borderStyle: 'dashed' },
  text: { fontFamily: typeTokens.score.family },
});
