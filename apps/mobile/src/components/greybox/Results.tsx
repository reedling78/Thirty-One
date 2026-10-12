import type { PlayerView } from '@thirtyone/rules';
import { Pressable, StyleSheet, View } from 'react-native';
import { Txt } from '@/theme/text';
import { color, radius, space } from '@/theme/tokens';

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
      <Txt variant="display" color={color.onBaize} style={styles.center}>
        {winner === null ? 'No winner' : winner === view.seat ? 'You win!' : `${name(winner)} wins`}
      </Txt>
      {winner !== null && (
        <View style={styles.list}>
          <Txt variant="label" color={color.onBaize}>
            Finishing order
          </Txt>
          <Txt variant="body" color={color.onBaize}>
            1. {name(winner)}
          </Txt>
          {[...eliminationOrder].reverse().map((seat, i) => (
            <Txt key={seat} variant="body" color={color.onBaize}>
              {i + 2}. {name(seat)}
            </Txt>
          ))}
        </View>
      )}
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={onPlayAgain} style={styles.button}>
          <Txt variant="button" color={color.onBaize}>
            Play again
          </Txt>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onHome} style={styles.button}>
          <Txt variant="button" color={color.onBaize}>
            Home
          </Txt>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: space.xxl, gap: space.xl, justifyContent: 'center' },
  center: { textAlign: 'center' },
  list: { gap: space.xs },
  actions: { flexDirection: 'row', gap: space.md, justifyContent: 'center' },
  button: {
    paddingVertical: space.md,
    paddingHorizontal: space.xl,
    borderWidth: 1.5,
    borderColor: color.onBaize,
    borderRadius: radius.md,
  },
});
