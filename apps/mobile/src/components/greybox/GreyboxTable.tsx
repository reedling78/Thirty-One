import type { Card, PlayerView } from '@thirtyone/rules';
import { cardId } from '@thirtyone/rules';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import type { TableClient } from '@/game/TableClient';
import { CardView, cardName } from './CardView';
import { ActionIsland } from './ActionIsland';
import { CardText } from './CardText';
import { ChipBadge } from './ChipBadge';
import { SeatView, revealTag } from './SeatView';
import { useSettings } from '@/settings/Settings';

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
          <Text style={styles.pileLabel}>Deck · {view.drawPileCount}</Text>
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
              <Text>empty</Text>
            </View>
          )}
          <Text style={styles.pileLabel}>Discard · {view.discardPileCount}</Text>
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
        <View style={styles.meHeader}>
          <View style={styles.meTitle}>
            <Text style={styles.name}>You{me.isKnocker ? ' · knocked' : ''}</Text>
            {myVerdict ? (
              <Text style={[styles.verdict, myVerdict.loser && styles.verdictLoser]}>
                {myVerdict.tag}
              </Text>
            ) : (
              <Text style={styles.value} accessibilityLiveRegion="polite">
                {scoreText}
              </Text>
            )}
          </View>
          {me.revealed ? (
            <Text
              style={styles.myScore}
              accessibilityLabel={`Your score: ${me.revealed.score.total}`}
            >
              {me.revealed.score.total}
            </Text>
          ) : (
            <ChipBadge folds={me.folds} out={me.out} size={36} />
          )}
        </View>
        <View style={styles.hand}>
          {view.hand.map((c, i) => {
            const untouchable =
              !!view.tookFromDiscard && cardId(view.tookFromDiscard) === cardId(c);
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
                  onPress={canDiscard && !untouchable ? () => discard(c) : undefined}
                  dimmed={notCounted}
                  label={`${cardName(c)}${notCounted ? ', not part of the hand' : ''}${canDiscard ? (untouchable ? ', just taken, cannot discard' : '. Tap to discard') : ''}`}
                />
              </Animated.View>
            );
          })}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <View style={styles.log} accessibilityLiveRegion="polite">
        {log.filter(Boolean).map((line, i) => (
          <CardText key={i} style={styles.logLine}>
            {line}
          </CardText>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 12, gap: 10 },
  seats: { gap: 6 },
  piles: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 24,
    paddingVertical: 16,
  },
  pile: { alignItems: 'center', gap: 4 },
  pileLabel: { fontSize: 12 },
  emptyPile: {
    minWidth: 88,
    minHeight: 126,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#999',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  me: { borderWidth: 2, borderColor: '#bbb', borderRadius: 8, padding: 10, gap: 8 },
  meTurn: { borderColor: '#000' },
  meKnocker: { backgroundColor: '#fff3c4' },
  meLoser: { borderColor: '#b00020', backgroundColor: '#fde8e8' },
  myScore: { fontSize: 24, fontWeight: '800', minWidth: 40, textAlign: 'right' },
  verdict: { fontSize: 14, color: '#333' },
  verdictLoser: { fontWeight: '800', color: '#b00020' },
  meHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meTitle: { flexDirection: 'row', alignItems: 'baseline', gap: 10, flex: 1, flexWrap: 'wrap' },
  name: { fontWeight: '700', fontSize: 16 },
  hand: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  value: { fontSize: 16 },
  error: { color: '#b00020' },
  log: { gap: 2, flex: 1, minHeight: 60 },
  logLine: { fontSize: 13, color: '#444' },
});
