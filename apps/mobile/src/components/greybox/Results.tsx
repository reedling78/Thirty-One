import type { PlayerView } from '@thirtyone/rules';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { CHIP, PANEL } from '@/theme/components';
import { Txt } from '@/theme/text';
import { color, space } from '@/theme/tokens';
import { ChipBadge } from './ChipBadge';

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
  const order = winner === null ? [] : [winner, ...[...eliminationOrder].reverse()];
  return (
    <View style={styles.root} accessibilityRole="summary">
      <View style={styles.top}>
        <Txt variant="display" color={color.onBaize} accessibilityRole="header">
          {winner === null
            ? 'No winner'
            : winner === view.seat
              ? 'You win!'
              : `${name(winner)} wins`}
        </Txt>
        {order.length > 0 && (
          <View style={styles.list} accessibilityLabel="Finishing order">
            {order.map((seat, i) => {
              const s = view.seats[seat];
              return (
                <View
                  key={seat}
                  style={[styles.row, i === 0 && styles.winner]}
                  accessible
                  accessibilityLabel={`${i + 1}. ${name(seat)}`}
                >
                  <Txt variant="score" color={color.ink} style={styles.place}>
                    {String(i + 1)}
                  </Txt>
                  <Txt variant="label" color={color.ink} style={styles.name}>
                    {name(seat)}
                  </Txt>
                  {s ? <ChipBadge folds={s.folds} out={s.out} size={CHIP.size.row} /> : null}
                </View>
              );
            })}
          </View>
        )}
      </View>
      <View style={styles.actions}>
        <Button
          variant="primary"
          ground="baize"
          size="hero"
          label="Play again"
          onPress={onPlayAgain}
        />
        <Button ground="baize" size="hero" label="Home" onPress={onHome} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: space.xxl,
    paddingTop: space.xxxl,
    paddingBottom: space.xxl,
  },
  top: { gap: space.xxl },
  list: { gap: PANEL.rowListGap },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: PANEL.rowPad.top + 2,
    paddingHorizontal: space.md,
    borderRadius: PANEL.rowRadius,
    backgroundColor: color.paper,
  },
  winner: { backgroundColor: color.turnFill },
  place: { minWidth: 28 },
  name: { flex: 1 },
  actions: { gap: space.md },
});
