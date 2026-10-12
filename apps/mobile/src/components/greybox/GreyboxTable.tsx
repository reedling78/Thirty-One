import type { Card, PlayerView } from '@thirtyone/rules';
import { cardId } from '@thirtyone/rules';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import type { TableClient } from '@/game/TableClient';
import { CardView, cardName } from './CardView';
import { ActionIsland } from './ActionIsland';
import { CardText } from './CardText';
import { DealerButton, Pill } from '@/components/ui/Marks';
import { ChipBadge } from './ChipBadge';
import { SeatView, revealTag } from './SeatView';
import { useSettings } from '@/settings/Settings';
import { SIZE } from '@/theme/cardArt';
import { EMPTY_PILE, PANEL } from '@/theme/components';
import { Txt } from '@/theme/text';
import { color, layout, radius, space } from '@/theme/tokens';

interface Props {
  client: TableClient;
  view: PlayerView;
  log: readonly string[];
  /** Each seat's last move this round, from useTable. */
  lastActions: Readonly<Record<number, string>>;
}

/**
 * The practice table, greyboxed: rectangles and system text, fully playable.
 * This is where the layout gets tested against real play; styling is Milestone 5.
 */
export function GreyboxTable({ client, view, log, lastActions }: Props) {
  const [error, setError] = useState<string | null>(null);
  const { motionReduced } = useSettings();
  const me = view.seats[view.seat]!;
  const canDraw = view.legalActions.includes('draw');
  const canDiscard = view.legalActions.includes('discard');
  const revealing = view.phase === 'roundOver' && view.roundResult !== null;
  const myVerdict = revealing ? revealTag(me, view.roundResult!) : null;

  const act = (action: Parameters<TableClient['send']>[0]) => {
    const err = client.send(action);
    setError(err ? err.message : null);
  };

  const discard = (card: Card) => act({ type: 'discard', card });
  const others = view.seats.filter((s) => s.index !== view.seat);
  const score = view.handScore;
  const scoreText = score
    ? score.kind === 'trips'
      ? `${score.total} — three of a kind`
      : score.kind === 'straight'
        ? `${score.total} — straight in ${score.suit}`
        : score.kind === 'thirtyOne'
          ? '31!'
          : `${score.total} in ${score.suit}`
    : '—';

  return (
    <View style={styles.root}>
      <ActionIsland
        view={view}
        onKnock={() => act({ type: 'knock' })}
        onContinue={() => client.acknowledgeReveal()}
      />

      <View style={styles.seats}>
        {others.map((s, i) => (
          <SeatView
            key={s.index}
            seat={s}
            result={revealing ? view.roundResult : null}
            round={view.round}
            order={i}
            lastAction={lastActions[s.index] ?? null}
          />
        ))}
      </View>

      <View style={styles.piles}>
        <View style={styles.pile}>
          <CardView
            faceDown
            size="large"
            onPress={canDraw ? () => act({ type: 'draw', source: 'deck' }) : undefined}
            disabled={!canDraw}
            label={`Draw pile, ${view.drawPileCount} cards${canDraw ? '. Tap to draw' : ''}`}
          />
          <Txt variant="status" color={color.onBaizeSecondary}>
            Deck · {view.drawPileCount}
          </Txt>
        </View>
        <View style={styles.pile}>
          {view.discardTop ? (
            <CardView
              card={view.discardTop}
              size="large"
              onPress={canDraw ? () => act({ type: 'draw', source: 'discard' }) : undefined}
              disabled={!canDraw}
              label={`Discard pile, ${cardName(view.discardTop)} on top${canDraw ? '. Tap to take it' : ''}`}
            />
          ) : (
            <View style={styles.emptyPile}>
              <Txt variant="status" fixed color={color.onBaizeSecondary}>
                empty
              </Txt>
            </View>
          )}
          <Txt variant="status" color={color.onBaizeSecondary}>
            Discard · {view.discardPileCount}
          </Txt>
        </View>
      </View>

      <View
        style={[
          styles.me,
          me.isTurn && styles.meTurn,
          me.isKnocker && styles.meKnocker,
          myVerdict?.loser && styles.meLoser,
        ]}
      >
        {me.isTurn || me.isKnocker || myVerdict?.loser ? (
          <View
            style={[
              styles.bar,
              {
                backgroundColor: myVerdict?.loser
                  ? color.loserBar
                  : me.isKnocker
                    ? color.knockBar
                    : color.turnBar,
              },
            ]}
          />
        ) : null}
        <View style={styles.meHeader}>
          <View style={styles.meTitle}>
            <Txt variant="title" color={color.ink}>
              You
            </Txt>
            {me.isDealer ? <DealerButton /> : null}
            {me.isKnocker ? <Pill>KNOCKED</Pill> : null}
            {myVerdict ? (
              <Txt variant="label" color={color.ink}>
                {myVerdict.tag}
              </Txt>
            ) : (
              <Txt
                variant="label"
                color={color.inkSecondary}
                style={styles.value}
                accessibilityLiveRegion="polite"
              >
                {scoreText}
              </Txt>
            )}
          </View>
          {me.revealed ? (
            <Txt
              variant="score"
              color={color.ink}
              style={styles.myScore}
              accessibilityLabel={`Your score: ${me.revealed.score.total}`}
            >
              {String(me.revealed.score.total)}
            </Txt>
          ) : (
            <ChipBadge folds={me.folds} out={me.out} size={36} />
          )}
        </View>
        <View style={styles.hand}>
          {view.hand.map((c, i) => {
            // At the reveal, only the cards that count stay bright — a 31 drawn into a
            // four-card hand leaves one card out.
            const counted = me.revealed?.hand;
            const notCounted = !!counted && !counted.some((k) => cardId(k) === cardId(c));
            return (
              <Animated.View
                key={`${view.round}-${cardId(c)}`}
                entering={
                  motionReduced
                    ? undefined
                    : FadeInUp.delay(i < 3 ? i * 140 : 0).duration(i < 3 ? 260 : 180)
                }
              >
                <CardView
                  card={c}
                  onPress={canDiscard ? () => discard(c) : undefined}
                  dimmed={notCounted}
                  label={`${cardName(c)}${notCounted ? ', not part of the hand' : ''}${canDiscard ? '. Tap to discard' : ''}`}
                />
              </Animated.View>
            );
          })}
        </View>
        {error ? (
          <Txt variant="status" color={color.ink}>
            {error}
          </Txt>
        ) : null}
      </View>

      <View style={styles.log} accessibilityLiveRegion="polite">
        {log.filter(Boolean).map((line, i) => (
          <CardText key={i} color={color.onBaizeSecondary}>
            {line}
          </CardText>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: PANEL.gutter, gap: space.sm },
  seats: { gap: PANEL.rowListGap },
  piles: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: space.xxl,
    paddingVertical: space.lg,
  },
  pile: { alignItems: 'center', gap: space.xs },
  emptyPile: {
    width: SIZE.large.w,
    height: SIZE.large.h,
    borderWidth: EMPTY_PILE.border,
    borderStyle: 'dashed',
    borderColor: EMPTY_PILE.color,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  me: {
    borderRadius: radius.panel,
    paddingTop: PANEL.panelPad.top,
    paddingRight: PANEL.panelPad.right,
    paddingBottom: PANEL.panelPad.bottom,
    paddingLeft: PANEL.panelPad.left,
    gap: space.sm,
    backgroundColor: color.paper,
    overflow: 'hidden',
  },
  meTurn: { backgroundColor: color.turnFill },
  bar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: layout.stateBarWidth },
  meKnocker: { backgroundColor: color.knockTint },
  meLoser: { backgroundColor: color.loserFill },
  myScore: { minWidth: PANEL.figureWidth, textAlign: 'right' },
  meHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, flexWrap: 'wrap' },
  hand: { flexDirection: 'row', gap: PANEL.handGap, flexWrap: 'wrap' },
  value: {},
  log: { gap: 2, flex: 1, minHeight: 60 },
});
