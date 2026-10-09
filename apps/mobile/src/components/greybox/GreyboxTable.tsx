import type { Card, PlayerView } from '@thirtyone/rules';
import { cardId } from '@thirtyone/rules';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { TableClient } from '@/game/TableClient';
import { CardView, cardName } from './CardView';
import { SeatView } from './SeatView';

interface Props {
  client: TableClient;
  view: PlayerView;
  log: readonly string[];
}

/**
 * The practice table, greyboxed: rectangles and system text, fully playable.
 * This is where the layout gets tested against real play; styling is Milestone 5.
 */
export function GreyboxTable({ client, view, log }: Props) {
  const [error, setError] = useState<string | null>(null);
  const me = view.seats[view.seat]!;
  const canDraw = view.legalActions.includes('draw');
  const canKnock = view.legalActions.includes('knock');
  const canDiscard = view.legalActions.includes('discard');

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
      <Text style={styles.status} accessibilityRole="header">
        Round {view.round} · {phaseText(view)}
      </Text>

      <ScrollView
        horizontal
        contentContainerStyle={styles.seats}
        showsHorizontalScrollIndicator={false}
      >
        {others.map((s) => (
          <SeatView key={s.index} seat={s} isMe={false} />
        ))}
      </ScrollView>

      <View style={styles.piles}>
        <View style={styles.pile}>
          <CardView
            faceDown
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

      <View style={styles.me}>
        <Text style={styles.name}>
          You · {me.out ? 'OUT' : me.onBus ? 'ON THE BUS' : `${me.folds}/4 corners folded`}
          {me.isKnocker ? ' · knocked' : ''}
        </Text>
        <View style={styles.hand}>
          {view.hand.map((c) => {
            const untouchable =
              !!view.tookFromDiscard && cardId(view.tookFromDiscard) === cardId(c);
            return (
              <CardView
                key={cardId(c)}
                card={c}
                onPress={canDiscard ? () => discard(c) : undefined}
                disabled={!canDiscard || untouchable}
                label={`${cardName(c)}${canDiscard ? (untouchable ? ', just taken, cannot discard' : '. Tap to discard') : ''}`}
              />
            );
          })}
        </View>
        <Text style={styles.value} accessibilityLiveRegion="polite">
          Hand value: {scoreText}
        </Text>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canKnock }}
            disabled={!canKnock}
            onPress={() => act({ type: 'knock' })}
            style={[styles.button, !canKnock && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>Knock</Text>
          </Pressable>
          <Text style={styles.hint}>
            {canDiscard
              ? 'Tap a card to discard'
              : canDraw
                ? 'Tap the deck or the discard to draw'
                : ''}
          </Text>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <View style={styles.log} accessibilityLiveRegion="polite">
        {log.filter(Boolean).map((line, i) => (
          <Text key={i} style={styles.logLine}>
            {line}
          </Text>
        ))}
      </View>
    </View>
  );
}

function phaseText(view: PlayerView): string {
  switch (view.phase) {
    case 'playing':
      return view.turn === view.seat
        ? 'your turn'
        : `${view.seats[view.turn]?.id ?? 'someone'} to play`;
    case 'roundOver':
      return 'hands revealed';
    case 'betweenRounds':
      return 'dealing…';
    case 'gameOver':
      return 'game over';
    default:
      return view.phase;
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 12, gap: 12 },
  status: { fontSize: 16, fontWeight: '700' },
  seats: { gap: 8, paddingVertical: 4 },
  piles: { flexDirection: 'row', justifyContent: 'center', gap: 32 },
  pile: { alignItems: 'center', gap: 4 },
  pileLabel: { fontSize: 12 },
  emptyPile: {
    minWidth: 48,
    minHeight: 68,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#999',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  me: { borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 10, gap: 8 },
  name: { fontWeight: '700' },
  hand: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  value: { fontSize: 16 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 6,
  },
  buttonDisabled: { opacity: 0.3 },
  buttonText: { fontWeight: '700', fontSize: 16 },
  hint: { flex: 1, fontSize: 12 },
  error: { color: '#b00020' },
  log: { gap: 2 },
  logLine: { fontSize: 13, color: '#444' },
});
