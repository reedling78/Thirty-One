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
  /** A pill after the name, e.g. KNOCKED. */
  badge?: string;
  /** Show the dealer button. */
  dealer?: boolean;
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
  badge,
  dealer,
  dealKey = 0,
  delay = 0,
}: Props) {
  const { motionReduced } = useSettings();
  const figureLabel =
    figure.kind === 'score'
      ? `score ${figure.total}`
      : `${Math.max(0, 4 - figure.folds)} of 4 corners left`;
  const label = `${name}${dealer ? ', dealer' : ''}${badge ? `, ${badge.toLowerCase()}` : ''}: ${tag}. ${figureLabel}`;
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
      {emphasis === 'turn' ? <View style={styles.turnBar} /> : null}
      <View style={styles.who}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{name}</Text>
          {dealer ? (
            <View style={styles.dealerButton} accessibilityLabel="Dealer">
              <Text style={styles.dealerText}>D</Text>
            </View>
          ) : null}
          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        <CardText style={[styles.tag, emphasis === 'turn' && styles.tagTurn]}>{tag}</CardText>
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
  turn: { borderColor: '#000', backgroundColor: '#eef2ff' },
  turnBar: {
    width: 6,
    alignSelf: 'stretch',
    backgroundColor: '#000',
    borderRadius: 3,
    marginLeft: -4,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dealerButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#111',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dealerText: { fontSize: 11, fontWeight: '900', color: '#111' },
  badge: { backgroundColor: '#000', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { color: '#fff', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  tagTurn: { fontWeight: '700', color: '#000' },
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
