import type { Card } from '@thirtyone/rules';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSettings } from '@/settings/Settings';
import { CardText } from './CardText';
import { ChipBadge } from './ChipBadge';
import { CardView } from './CardView';
import { DEALER, PANEL, PILL } from '@/theme/components';
import { Txt } from '@/theme/text';
import { color, layout, radius, type as typeTokens } from '@/theme/tokens';

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
      {emphasis !== 'none' ? <View style={[styles.bar, BARS[emphasis]]} /> : null}
      <View style={styles.who}>
        <View style={styles.nameRow}>
          <Txt variant="label" color={color.ink}>
            {name}
          </Txt>
          {dealer ? (
            <View style={styles.dealerButton} accessibilityLabel="Dealer">
              <Text allowFontScaling={false} style={styles.dealerText}>
                D
              </Text>
            </View>
          ) : null}
          {badge ? (
            <View style={styles.badge}>
              <Txt variant="pill" color={color.paper}>
                {badge}
              </Txt>
            </View>
          ) : null}
        </View>
        <CardText
          color={emphasis === 'none' ? color.inkSecondary : color.ink}
          bold={emphasis === 'turn' || emphasis === 'loser'}
        >
          {tag}
        </CardText>
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
        <Txt variant="score" color={color.ink} style={styles.figure}>
          {String(figure.total)}
        </Txt>
      ) : (
        <ChipBadge folds={figure.folds} out={figure.out} size={32} />
      )}
    </View>
  );
}

const BARS = StyleSheet.create({
  turn: { backgroundColor: color.turnBar },
  knocker: { backgroundColor: color.knockBar },
  loser: { backgroundColor: color.loserBar },
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: PANEL.rowGap,
    paddingTop: PANEL.rowPad.top,
    paddingRight: PANEL.rowPad.right,
    paddingBottom: PANEL.rowPad.bottom,
    paddingLeft: PANEL.rowPad.left,
    borderRadius: PANEL.rowRadius,
    backgroundColor: color.paper,
    overflow: 'hidden',
  },
  turn: { backgroundColor: color.turnFill },
  bar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: layout.stateBarWidth },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dealerButton: {
    width: DEALER.size,
    height: DEALER.size,
    borderRadius: DEALER.size / 2,
    borderWidth: 1,
    borderColor: DEALER.border,
    backgroundColor: DEALER.face,
    alignItems: 'center',
    justifyContent: 'center',
    ...DEALER.shadow,
  },
  dealerText: { fontSize: DEALER.font, fontFamily: typeTokens.score.family, color: color.ink },
  badge: {
    minHeight: PILL.height,
    justifyContent: 'center',
    backgroundColor: color.ink,
    borderRadius: radius.pill,
    paddingHorizontal: PILL.padH,
  },
  knocker: { backgroundColor: color.knockTint },
  loser: { backgroundColor: color.loserFill },
  me: {},
  dimmed: { opacity: 0.6 },
  who: { flex: 1, gap: 2 },
  cards: { flexDirection: 'row', gap: PANEL.smallCardGap },
  figure: { minWidth: PANEL.figureWidth, textAlign: 'right' },
});
