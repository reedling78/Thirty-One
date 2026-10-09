import type { SeatView as SeatInfo } from '@thirtyone/rules';
import { StyleSheet, Text, View } from 'react-native';
import { CardView } from './CardView';

interface Props {
  seat: SeatInfo;
  isMe: boolean;
}

/** One opponent's seat: name, cards (count or revealed), corners, and state markers. */
export function SeatView({ seat, isMe }: Props) {
  const name = isMe ? 'You' : seat.id;
  const corners = seat.out ? 'OUT' : seat.onBus ? 'ON THE BUS' : `${seat.folds}/4 corners folded`;
  const markers = [seat.isTurn && 'turn', seat.isKnocker && 'knocked', seat.isDealer && 'dealer']
    .filter(Boolean)
    .join(' · ');
  const label = `${name}: ${seat.cardCount} cards, ${corners}${markers ? ', ' + markers : ''}`;

  return (
    <View
      accessible
      accessibilityLabel={label}
      style={[styles.seat, seat.isTurn && styles.turn, seat.out && styles.out]}
    >
      <Text style={styles.name}>
        {name} {markers ? `(${markers})` : ''}
      </Text>
      <View style={styles.cards}>
        {seat.revealed
          ? seat.revealed.hand.map((c, i) => <CardView key={i} card={c} />)
          : Array.from({ length: seat.cardCount }, (_, i) => <CardView key={i} faceDown />)}
      </View>
      <Text style={styles.meta}>
        {seat.revealed ? `${seat.revealed.score.total} · ` : ''}
        {corners}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  seat: { padding: 8, borderWidth: 1, borderColor: '#bbb', borderRadius: 8, gap: 4, minWidth: 120 },
  turn: { borderColor: '#000', borderWidth: 3 },
  out: { opacity: 0.4 },
  name: { fontWeight: '700' },
  cards: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  meta: { fontSize: 12 },
});
