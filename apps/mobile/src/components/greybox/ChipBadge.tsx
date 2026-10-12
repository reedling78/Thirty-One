import { StyleSheet, Text, View } from 'react-native';

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
  return (
    <View
      accessible
      accessibilityLabel={label}
      style={[
        styles.chip,
        { width: size, height: size, borderRadius: size / 2 },
        onBus && styles.bus,
        out && styles.out,
      ]}
    >
      <View style={[styles.ring, { width: ring, height: ring, borderRadius: ring / 2 }]} />
      <Text style={[styles.text, { fontSize: text.length > 1 ? size * 0.28 : size * 0.45 }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#111',
    backgroundColor: '#f4f4f4',
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#111',
  },
  bus: { backgroundColor: '#111', borderColor: '#111' },
  out: { opacity: 0.35 },
  text: { fontWeight: '900', color: '#111' },
});
