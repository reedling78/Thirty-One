import type { Card } from '@thirtyone/rules';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSettings } from '@/settings/Settings';
import { CardText } from './CardText';
import { ChipBadge } from './ChipBadge';
import { CardView } from './CardView';

interface Props {
  name: string;
  /** One line under the name: "knocked — safe", "your turn", "on the bus"… */
  tag: string;
  /** Face-up cards, or a count of face-down ones. */
  cards: readonly Card[] | number;
  /** The right-hand slot: a chip with corners left during play, or a score at the reveal. */
  figure: { kind: 'chip'; folds: number; out: boolean } | { kind: 'score'; total: number };
  emphasis?: 'none' | 'turn' | 'knocker' | 'loser';
  isMe?: boolean;
  dimmed?: boolean;
  /** Changes on every deal, so the cards animate in again. */
  dealKey?: string | number;
  /** Stagger offset for this row's cards, in ms. */
  delay?: number;
}

/**
 * One player as a row: who, what state, their cards, one figure. Used for
 * opponents on the table and for every seat at the reveal, so the two read alike.
 */
export function PlayerRow({
  name,
  tag,
  cards,
  figure,
  emphasis = 'none',
  isMe,
  dimmed,
  dealKey = 0,
  delay = 0,
}: Props) {
  const { motionReduced } = useSettings();
  const figureLabel =
    figure.kind === 'score'
      ? `score ${figure.total}`
      : `${Math.max(0, 4 - figure.folds)} of 4 corners left`;
  const label = `${name}: ${tag}. ${figureLabel}`;
  return (
    <View
      accessible
      accessibilityLabel={label}
      style={[
        styles.row,
        emphasis === 'turn' && styles.turn,
        emphasis === 'knocker' && styles.knocker,
        emphasis === 'loser' && styles.loser,
        isMe && styles.me,
        dimmed && styles.dimmed,
      ]}
    >
      <View style={styles.who}>
        <Text style={styles.name}>{name}</Text>
        <CardText style={styles.tag}>{tag}</CardText>
      </View>
      <View style={styles.cards}>
        {typeof cards === 'number'
          ? // Always three face-down cards: a drawn fourth lives for a moment and showing it only makes the row jump.
            Array.from({ length: Math.min(cards, 3) }, (_, i) => (
              <Animated.View
                key={`${dealKey}-${i}`}
                entering={motionReduced ? undefined : FadeInUp.delay(delay + i * 90).duration(220)}
              >
                <CardView faceDown size="small" />
              </Animated.View>
            ))
          : cards.map((c, i) => (
              <Animated.View
                key={`reveal-${i}`}
                entering={motionReduced ? undefined : FadeIn.delay(i * 80).duration(220)}
              >
                <CardView card={c} size="small" />
              </Animated.View>
            ))}
      </View>
      {figure.kind === 'score' ? (
        <Text style={styles.figure}>{figure.total}</Text>
      ) : (
        <ChipBadge folds={figure.folds} out={figure.out} size={32} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: '#bbb',
    borderRadius: 8,
  },
  turn: { borderColor: '#000' },
  knocker: { backgroundColor: '#fff3c4' },
  loser: { borderColor: '#b00020', backgroundColor: '#fde8e8' },
  me: { borderStyle: 'dashed' },
  dimmed: { opacity: 0.4 },
  who: { flex: 1, gap: 2 },
  name: { fontWeight: '700', fontSize: 16 },
  tag: { fontSize: 12, color: '#333' },
  cards: { flexDirection: 'row', gap: 3 },
  figure: { fontSize: 22, fontWeight: '800', minWidth: 40, textAlign: 'right' },
});
