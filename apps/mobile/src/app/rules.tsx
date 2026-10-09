import { FOLDS_TO_BUS, HAND_SIZE, MAX_SEATS, THIRTY_ONE, cardValue } from '@thirtyone/rules';
import { ScrollView, StyleSheet, Text } from 'react-native';

/**
 * Greybox rules screen. Reads from the engine's constants so it cannot drift;
 * the full version with rendered example hands is Milestone 6.
 */
export default function RulesScreen() {
  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Text style={styles.h}>The hand</Text>
      <Text style={styles.p}>
        Everyone holds {HAND_SIZE} cards. Your score is the total of the cards you hold in one suit
        — off-suit cards count for nothing. Ace is {cardValue('A')}, face cards and tens are{' '}
        {cardValue('K')}, the rest are face value.
      </Text>
      <Text style={styles.p}>
        Three of a kind, or three in a row in one suit, scores 30. Ace plus two ten-value cards in
        one suit is {THIRTY_ONE} — the best possible hand, and it wins the round on the spot.
      </Text>
      <Text style={styles.h}>Your turn</Text>
      <Text style={styles.p}>
        Draw one card from the deck or the top of the discard pile, then discard one face up. You
        can’t throw back the card you just took from the discard pile.
      </Text>
      <Text style={styles.h}>Knocking</Text>
      <Text style={styles.p}>
        If you think you won’t have the lowest hand, knock instead of taking your turn. Everyone
        else gets one more turn, then all hands are shown. The lowest hand loses the round. If the
        knocker has the lowest hand, it costs them double.
      </Text>
      <Text style={styles.h}>Corners and the bus</Text>
      <Text style={styles.p}>
        Each loss folds a corner of your chip. Fold all {FOLDS_TO_BUS} and you’re on the bus: one
        more loss and you’re out. Last player standing wins the pot. Tables seat up to {MAX_SEATS}.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { padding: 20, gap: 8 },
  h: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  p: { fontSize: 16, lineHeight: 22 },
});
