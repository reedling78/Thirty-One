import type { Card, PlayerView } from '@thirtyone/rules';
import { cardId } from '@thirtyone/rules';
import { useState } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import type { TableClient } from '@/game/TableClient';
import type { Callout } from '@/game/useRowCallouts';
import { DealerButton, Pill } from '@/components/ui/Marks';
import { useSettings } from '@/settings/Settings';
import { SIZE } from '@/theme/cardArt';
import { AD, AD_CAPTION, CHIP, EMPTY_PILE, PANEL, PILES, YOUR_PANEL } from '@/theme/components';
import { Txt, useFontScale } from '@/theme/text';
import { color, layout, radius, space, type as typeTokens } from '@/theme/tokens';
import { ActionIsland } from './ActionIsland';
import { CardView, cardName } from './CardView';
import { ChipBadge } from './ChipBadge';
import { ROW_STATE } from './PlayerRow';
import { LONGEST_YOUR_VERDICT, SeatView, revealTag } from './SeatView';

interface Props {
  client: TableClient;
  view: PlayerView;
  /** Recent events in words. Kept for the TableClient contract; the table shows each seat's last move instead. */
  log: readonly string[];
  /** Each seat's last move this round, from useTable. */
  lastActions: Readonly<Record<number, string>>;
  /** Stamps over opponents' rows, from useRowCallouts. */
  callouts?: Readonly<Record<number, Callout>>;
}

/**
 * The practice table, top to bottom: the action island, the opponents, the two
 * piles on the felt, your panel, and the ad slot. Only the opponent list flexes
 * (and scrolls when it must); everything below it has a fixed height, so the
 * piles and your hand sit at the same place in every state and at every seat count.
 */
export function GreyboxTable({ client, view, lastActions, callouts }: Props) {
  const [error, setError] = useState<string | null>(null);
  const { motionReduced } = useSettings();
  const scale = useFontScale();
  const me = view.seats[view.seat]!;
  const canDraw = view.legalActions.includes('draw');
  const canDiscard = view.legalActions.includes('discard');
  const revealing = view.phase === 'roundOver' && view.roundResult !== null;
  const myVerdict = revealing ? revealTag(me, view.roundResult!, true) : null;

  const act = (action: Parameters<TableClient['send']>[0]) => {
    const err = client.send(action);
    setError(err ? err.message : null);
    if (err) AccessibilityInfo.announceForAccessibility(err.message);
  };

  const discard = (card: Card) => act({ type: 'discard', card });
  const others = view.seats.filter((s) => s.index !== view.seat);
  const score = view.handScore;
  const scoreText = score
    ? score.kind === 'trips'
      ? `${score.total} — three of a kind`
      : score.kind === 'straight'
        ? `${score.total} — straight`
        : score.kind === 'thirtyOne'
          ? '31!'
          : `${score.total} in ${score.suit}`
    : 'waiting for cards';

  const state = myVerdict?.loser
    ? ROW_STATE.loser
    : me.isTurn
      ? ROW_STATE.turn
      : me.isKnocker
        ? ROW_STATE.knocker
        : ROW_STATE.none;

  const discardLabel = view.discardTop
    ? `Discard pile, ${view.discardPileCount} cards, ${cardName(view.discardTop)} on top${canDraw ? ', tap to take' : ''}`
    : 'Discard pile, empty';

  return (
    <View style={styles.root}>
      <ActionIsland
        view={view}
        onKnock={() => act({ type: 'knock' })}
        onContinue={() => client.acknowledgeReveal()}
      />

      <ScrollView style={styles.seats} contentContainerStyle={styles.seatList}>
        {others.map((s, i) => (
          <SeatView
            key={s.index}
            seat={s}
            result={revealing ? view.roundResult : null}
            round={view.round}
            order={i}
            lastAction={lastActions[s.index] ?? null}
            callout={callouts?.[s.index]}
          />
        ))}
      </ScrollView>

      <View style={styles.piles}>
        <CardView
          faceDown
          size="large"
          onPress={canDraw ? () => act({ type: 'draw', source: 'deck' }) : undefined}
          disabled={!canDraw}
          label={`Deck, ${view.drawPileCount} cards${canDraw ? ', tap to draw' : ''}`}
        />
        {view.discardTop ? (
          <CardView
            card={view.discardTop}
            size="large"
            onPress={canDraw ? () => act({ type: 'draw', source: 'discard' }) : undefined}
            disabled={!canDraw}
            label={discardLabel}
          />
        ) : (
          <View style={styles.emptyPile} accessible accessibilityLabel={discardLabel}>
            <Txt variant="status" fixed color={color.onBaizeSecondary}>
              empty
            </Txt>
          </View>
        )}
      </View>

      <View style={[styles.me, { backgroundColor: state.fill }]}>
        {state.bar ? <View style={[styles.bar, { backgroundColor: state.bar }]} /> : null}
        <View style={styles.meHeader}>
          <View style={styles.titleArea}>
            {/* An invisible worst case — dealer disc, KNOCKED pill and the longest
                verdict — sets the header's height, so the panel never changes height
                between states, at any text size or screen width. */}
            <View
              style={[styles.meTitle, styles.ghost]}
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <Txt variant="title">You</Txt>
              <DealerButton />
              <Pill>KNOCKED</Pill>
              <Txt variant="label">{LONGEST_YOUR_VERDICT}</Txt>
            </View>
            <View style={[styles.meTitle, styles.overlay]}>
              <Txt variant="title" color={color.ink}>
                You
              </Txt>
              {me.isDealer ? <DealerButton /> : null}
              {me.isKnocker ? <Pill>KNOCKED</Pill> : null}
              {error ? (
                <Txt variant="label" color={color.ink}>
                  {error}
                </Txt>
              ) : myVerdict ? (
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
          </View>
          <View style={styles.figure}>
            {me.revealed ? (
              <Txt
                variant="score"
                color={color.ink}
                style={{
                  fontSize: YOUR_PANEL.scoreSize * scale,
                  lineHeight: YOUR_PANEL.scoreSize * scale,
                }}
                accessibilityLabel={`Your score: ${me.revealed.score.total}`}
              >
                {String(me.revealed.score.total)}
              </Txt>
            ) : (
              <ChipBadge folds={me.folds} out={me.out} size={CHIP.size.panel} />
            )}
          </View>
        </View>
        <View style={styles.hand}>
          {view.hand.length === 0
            ? // Between rounds the hand is three backs, so the panel keeps its height.
              [0, 1, 2].map((i) => <CardView key={i} faceDown size="normal" />)
            : view.hand.map((c, i) => {
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
                      label={`${cardName(c)}${notCounted ? ', not part of the hand' : ''}${canDiscard ? ', tap to discard' : ''}`}
                    />
                  </Animated.View>
                );
              })}
        </View>
      </View>

      <AdSlot />
    </View>
  );
}

/** The fixed 320×100 large-banner slot. A placeholder until ads are wired; never text-scaled. */
function AdSlot() {
  return (
    <View style={styles.adOuter}>
      <View
        style={styles.ad}
        accessible
        accessibilityRole="image"
        accessibilityLabel="Advertisement"
      >
        <Text allowFontScaling={false} style={[styles.adText, styles.adLabel]}>
          AD
        </Text>
        <Text allowFontScaling={false} style={styles.adText}>
          320 × 100 large banner
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  seats: { flex: 1, minHeight: 0 },
  seatList: {
    paddingTop: space.sm,
    paddingHorizontal: PANEL.gutter,
    paddingBottom: space.xs,
    gap: PANEL.rowListGap,
  },
  piles: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: PILES.gap,
    paddingTop: PILES.padTop,
    paddingBottom: PILES.padBottom,
  },
  emptyPile: {
    width: SIZE.large.w,
    height: SIZE.large.h,
    borderWidth: EMPTY_PILE.border,
    borderStyle: 'dashed',
    borderColor: EMPTY_PILE.color,
    borderRadius: SIZE.large.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  me: {
    marginHorizontal: PANEL.gutter,
    borderRadius: radius.panel,
    paddingTop: PANEL.panelPad.top,
    paddingRight: PANEL.panelPad.right,
    paddingBottom: PANEL.panelPad.bottom,
    paddingLeft: PANEL.panelPad.left,
    gap: space.sm,
    overflow: 'hidden',
  },
  bar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: layout.stateBarWidth },
  meHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: PANEL.rowGap },
  meTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  value: { fontFamily: typeTokens.body.family },
  titleArea: { flex: 1, minWidth: 0 },
  ghost: { opacity: 0 },
  overlay: { ...StyleSheet.absoluteFill, alignContent: 'flex-start' },
  figure: { width: PANEL.figureWidth, alignItems: 'flex-end' },
  hand: { flexDirection: 'row', gap: PANEL.handGap, minHeight: SIZE.normal.h },
  adOuter: {
    height: layout.adSlot.outerHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ad: {
    width: layout.adSlot.width,
    height: layout.adSlot.height,
    borderRadius: radius.md,
    borderWidth: AD.border,
    borderStyle: 'dashed',
    borderColor: AD.color,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  adText: {
    fontFamily: typeTokens.status.family,
    fontSize: AD_CAPTION,
    color: color.onBaizeSecondary,
  },
  adLabel: { fontFamily: typeTokens.label.family, letterSpacing: typeTokens.pill.letterSpacing },
});
