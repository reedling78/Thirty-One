import type { Card } from '@thirtyone/rules';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { DealerButton, Pill, PlayingMark } from '@/components/ui/Marks';
import { useSettings } from '@/settings/Settings';
import { CHIP, OUT_OPACITY, PANEL } from '@/theme/components';
import { Txt, useFontScale } from '@/theme/text';
import { color, layout } from '@/theme/tokens';
import { CardText } from './CardText';
import { CardView } from './CardView';
import { ChipBadge } from './ChipBadge';

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

/** Each state is a bar, a fill and a word; the word is the tag, these are the other two. */
export const ROW_STATE = {
  none: { fill: color.paper, bar: null },
  turn: { fill: color.turnFill, bar: color.turnBar },
  knocker: { fill: color.knockTint, bar: color.knockBar },
  loser: { fill: color.loserFill, bar: color.loserBar },
} as const;

/**
 * One player as a row: who, what state, their cards, one figure. Used for
 * opponents on the table and for every seat at the reveal, so the two read alike.
 * The name block always reserves a name line and two status lines, so a row
 * never changes height as its status changes.
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
  const scale = useFontScale();
  const state = ROW_STATE[emphasis];
  const figureLabel =
    figure.kind === 'score'
      ? `score ${figure.total}`
      : figure.out
        ? 'out of the game'
        : figure.folds >= 4
          ? 'on the bus'
          : `${4 - figure.folds} of 4 corners left`;
  const label = `${name}${isMe ? ' (you)' : ''}${dealer ? ', dealer' : ''}${badge ? `, ${badge.toLowerCase()}` : ''}: ${tag}. ${figureLabel}`;
  // The active line and verdicts read in bold ink; a last move in secondary ink.
  const strong = emphasis === 'turn' || figure.kind === 'score';
  return (
    <View
      accessible
      accessibilityLabel={label}
      style={[styles.row, { backgroundColor: state.fill }, dimmed && styles.dimmed]}
    >
      {state.bar ? <View style={[styles.bar, { backgroundColor: state.bar }]} /> : null}
      <View style={[styles.who, { minHeight: layout.rowMinHeight * scale }]}>
        <View style={styles.nameRow}>
          <Txt variant="label" color={color.ink}>
            {name}
          </Txt>
          {dealer ? <DealerButton /> : null}
          {badge ? <Pill>{badge}</Pill> : null}
        </View>
        <View style={styles.status}>
          {emphasis === 'turn' ? <PlayingMark /> : null}
          <View style={styles.statusText}>
            <CardText color={strong ? color.ink : color.inkSecondary} bold={strong}>
              {tag}
            </CardText>
          </View>
        </View>
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
      <View style={styles.figure}>
        {figure.kind === 'score' ? (
          <Txt variant="score" color={color.ink}>
            {String(figure.total)}
          </Txt>
        ) : (
          <ChipBadge folds={figure.folds} out={figure.out} size={CHIP.size.row} />
        )}
      </View>
    </View>
  );
}

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
    overflow: 'hidden',
  },
  bar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: layout.stateBarWidth },
  who: { flex: 1, minWidth: 0, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  status: { flexDirection: 'row', alignItems: 'center' },
  statusText: { flex: 1 },
  cards: { flexDirection: 'row', gap: PANEL.smallCardGap },
  figure: { width: PANEL.figureWidth, alignItems: 'flex-end', justifyContent: 'center' },
  dimmed: { opacity: OUT_OPACITY },
});
