import {
  FOLDS_TO_BUS,
  HAND_SIZE,
  THIRTY_ONE,
  cardValue,
  parseHand,
  scoreHand,
  type Hand,
} from '@thirtyone/rules';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CardView } from '@/components/greybox/CardView';

/** The example hands from the rules, scored by the engine so the screen can never drift from the game. */
const EXAMPLES: { hand: string; why: string }[] = [
  { hand: '2c 10c 2d', why: 'Clubs: 2 + 10. The 2♦ is off-suit and counts for nothing.' },
  { hand: '2h 10c 9d', why: 'No two cards share a suit, so the best single card is all you have.' },
  { hand: 'Kh 6c Qh', why: 'Hearts: 10 + 10.' },
  { hand: '3h 3c 3d', why: 'Three of a kind is a flat 30.' },
  { hand: '3h 4h 5h', why: 'Three in a row in one suit is also 30.' },
  {
    hand: 'As 2s 3s',
    why: 'The Ace plays low here: a straight for 30, better than the 16 the cards add up to.',
  },
  {
    hand: 'Kh Ah Qh',
    why: 'Ace plus two ten-value cards in one suit — 31, the best hand, and it wins on the spot.',
  },
];

export default function RulesScreen() {
  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Section title="The idea">
        Everyone holds {HAND_SIZE} cards and tries to make them worth as much as possible. At the
        end of each round the lowest hand loses a life. Last player standing wins the pot.
      </Section>

      <Section title="Card values">
        Ace is {cardValue('A')}. King, Queen, Jack and 10 are {cardValue('K')}. Everything else is
        its face value.
      </Section>

      <Section title="Scoring a hand">
        Your score is the total of the cards you hold in one suit — whichever suit gives you the
        most. Off-suit cards count for nothing. Two special hands score a flat 30: three of a kind,
        and three in a row in one suit (the Ace can be high or low). Ace plus two ten-value cards in
        one suit is {THIRTY_ONE}, the best possible hand.
      </Section>

      <View style={styles.examples}>
        {EXAMPLES.map(({ hand, why }) => (
          <Example key={hand} hand={parseHand(hand)} why={why} />
        ))}
      </View>

      <Section title="Your turn">
        Draw one card — the face-down top of the deck, or the face-up top of the discard pile — then
        discard one face up. Everything on the table is information: what someone throws, and
        whether they take from the discard, tells you what they’re chasing.
      </Section>

      <Section title="Knocking">
        When you think you won’t have the lowest hand, knock instead of taking your turn. You can
        only knock when all three of your cards count — three of one suit, or three of a kind.
        Everyone else gets one more turn, and nobody else may knock. Then all hands are shown and
        the lowest loses. If the knocker has the lowest hand, it costs them two lives instead of
        one.
      </Section>

      <Section title="31">
        If you reach {THIRTY_ONE} — even right after drawing, while you’re holding four cards — the
        round ends at once, and every other player loses a life.
      </Section>

      <Section title="Corners and the bus">
        Each player starts with one chip. Every loss folds a corner of it. Fold all {FOLDS_TO_BUS}{' '}
        and you’re on the bus: one more loss and you’re out, and your chip goes into the pot. The
        last player left takes the pot.
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.h} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.p}>{children}</Text>
    </View>
  );
}

function Example({ hand, why }: { hand: Hand; why: string }) {
  const s = scoreHand(hand);
  const kind =
    s.kind === 'thirtyOne'
      ? '31!'
      : s.kind === 'trips'
        ? 'three of a kind'
        : s.kind === 'straight'
          ? 'straight'
          : `in ${s.suit}`;
  return (
    <View
      style={styles.example}
      accessible
      accessibilityLabel={`Example: scores ${s.total}, ${kind}. ${why}`}
    >
      <View style={styles.cards}>
        {hand.map((c, i) => (
          <CardView key={i} card={c} size="small" />
        ))}
      </View>
      <View style={styles.exampleText}>
        <Text style={styles.score}>
          {s.total} <Text style={styles.kind}>{kind}</Text>
        </Text>
        <Text style={styles.why}>{why}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { padding: 20, gap: 18, paddingBottom: 40 },
  section: { gap: 6 },
  h: { fontSize: 18, fontWeight: '700' },
  p: { fontSize: 16, lineHeight: 22 },
  examples: { gap: 10 },
  example: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 8,
  },
  cards: { flexDirection: 'row', gap: 3 },
  exampleText: { flex: 1, gap: 2 },
  score: { fontSize: 18, fontWeight: '800' },
  kind: { fontSize: 13, fontWeight: '500', color: '#333' },
  why: { fontSize: 13, color: '#333' },
});
