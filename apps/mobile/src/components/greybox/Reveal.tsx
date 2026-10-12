import type { PlayerView } from '@thirtyone/rules';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PlayerRow } from './PlayerRow';

interface Props {
  view: PlayerView;
  onContinue(): void;
}

/**
 * End of round: every hand face-up, best first, with who knocked, who hit 31,
 * and who is folding a corner. Stays until the player taps Continue.
 */
export function Reveal({ view, onContinue }: Props) {
  const result = view.roundResult;
  if (!result) return null;
  const name = (seat: number) =>
    seat === view.seat ? 'You' : (view.seats[seat]?.id ?? `Seat ${seat}`);
  const penalty = new Map(result.penalties.map((p) => [p.seat, p.corners]));
  const ranked = [...result.hands].sort((a, b) => b.score.total - a.score.total);

  const headline =
    result.reason === 'thirtyOne'
      ? `${result.thirtyOneSeats.map(name).join(' and ')} ${result.thirtyOneSeats.length > 1 ? 'have' : 'has'} 31!`
      : result.knocker !== null
        ? `${name(result.knocker)} knocked`
        : 'Round over';

  return (
    <View style={styles.root} accessibilityViewIsModal accessibilityLabel="Round over">
      <Text style={styles.headline} accessibilityRole="header">
        {headline}
      </Text>
      <ScrollView contentContainerStyle={styles.list}>
        {ranked.map((h) => {
          const corners = penalty.get(h.seat) ?? 0;
          const seatInfo = view.seats[h.seat]!;
          const willBeOut = corners > 0 && seatInfo.folds + corners > 4;
          const tag =
            h.score.kind === 'thirtyOne'
              ? '31!'
              : corners === 2
                ? 'knocked and lowest — folds two corners'
                : corners === 1
                  ? willBeOut
                    ? 'lowest — out of the game'
                    : 'lowest — folds a corner'
                  : h.seat === result.knocker
                    ? 'knocked — safe'
                    : 'safe';
          return (
            <PlayerRow
              key={h.seat}
              name={name(h.seat)}
              tag={tag}
              cards={h.hand}
              figure={String(h.score.total)}
              figureLabel={`score ${h.score.total}`}
              emphasis={corners > 0 ? 'loser' : h.seat === result.knocker ? 'knocker' : 'none'}
              isMe={h.seat === view.seat}
            />
          );
        })}
      </ScrollView>
      <Pressable accessibilityRole="button" onPress={onContinue} style={styles.button}>
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16, gap: 12 },
  headline: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  list: { gap: 8 },
  button: {
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#000',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 18 },
});
