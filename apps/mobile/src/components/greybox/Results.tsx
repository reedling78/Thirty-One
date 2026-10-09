import type { PlayerView } from '@thirtyone/rules';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  view: PlayerView;
  /** Order players went out, earliest first. */
  eliminationOrder: readonly number[];
  onPlayAgain(): void;
  onHome(): void;
}

/** End of game: the winner and the order the others went out in. No chips in practice. */
export function Results({ view, eliminationOrder, onPlayAgain, onHome }: Props) {
  const name = (seat: number) =>
    seat === view.seat ? 'You' : (view.seats[seat]?.id ?? `Seat ${seat}`);
  const winner = view.winner;
  return (
    <View style={styles.root} accessibilityRole="summary">
      <Text style={styles.title}>
        {winner === null ? 'No winner' : winner === view.seat ? 'You win!' : `${name(winner)} wins`}
      </Text>
      {winner !== null && (
        <View style={styles.list}>
          <Text style={styles.heading}>Finishing order</Text>
          <Text>1. {name(winner)}</Text>
          {[...eliminationOrder].reverse().map((seat, i) => (
            <Text key={seat}>
              {i + 2}. {name(seat)}
            </Text>
          ))}
        </View>
      )}
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={onPlayAgain} style={styles.button}>
          <Text style={styles.buttonText}>Play again</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onHome} style={styles.button}>
          <Text style={styles.buttonText}>Home</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 24, gap: 20, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center' },
  list: { gap: 4 },
  heading: { fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 6,
  },
  buttonText: { fontWeight: '700', fontSize: 16 },
});
