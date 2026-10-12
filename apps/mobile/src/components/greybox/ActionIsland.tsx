import type { PlayerView } from '@thirtyone/rules';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  view: PlayerView;
  onKnock(): void;
  onContinue(): void;
}

interface Content {
  title: string;
  detail: string;
  button?: { label: string; onPress: () => void; a11y: string };
  tone: 'neutral' | 'mine' | 'knock' | 'reveal';
}

/**
 * The action island: always present above the opponents. It says what is
 * happening, what to do, and holds the one action the moment allows — Knock
 * when you may, Continue at the reveal.
 */
export function ActionIsland({ view, onKnock, onContinue }: Props) {
  const c = content(view, onKnock, onContinue);
  return (
    <View
      style={[styles.island, TONES[c.tone]]}
      accessibilityLiveRegion="polite"
      accessible={!c.button}
      accessibilityLabel={c.button ? undefined : `${c.title}. ${c.detail}`}
    >
      <View style={styles.text}>
        <Text style={[styles.title, c.tone === 'knock' && styles.titleKnock]}>{c.title}</Text>
        <Text style={styles.detail}>{c.detail}</Text>
      </View>
      {c.button ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={c.button.a11y}
          onPress={c.button.onPress}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>{c.button.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function content(view: PlayerView, onKnock: () => void, onContinue: () => void): Content {
  const name = (seat: number) =>
    seat === view.seat ? 'You' : (view.seats[seat]?.id ?? `Seat ${seat}`);
  const mine = view.turn === view.seat;

  if (view.phase === 'roundOver' && view.roundResult) {
    const r = view.roundResult;
    const losers = r.penalties.map((p) => name(p.seat));
    const title =
      r.reason === 'thirtyOne'
        ? `${r.thirtyOneSeats.map(name).join(' and ')} ${r.thirtyOneSeats.length > 1 ? 'have' : 'has'} 31!`
        : r.knocker !== null
          ? `${name(r.knocker)} knocked — hands revealed`
          : 'Hands revealed';
    const detail = losers.length
      ? `${losers.join(' and ')} ${losers.length > 1 ? 'fold' : 'folds'} a corner.`
      : 'Nobody folds.';
    return {
      title,
      detail,
      tone: 'reveal',
      button: { label: 'Continue', onPress: onContinue, a11y: 'Continue to the next round' },
    };
  }

  if (view.phase === 'betweenRounds')
    return { title: 'Dealing…', detail: 'Next round coming up.', tone: 'neutral' };
  if (view.phase === 'gameOver') return { title: 'Game over', detail: '', tone: 'neutral' };
  if (view.phase === 'lobby') return { title: 'Waiting to start', detail: '', tone: 'neutral' };

  if (view.knocker !== null) {
    const who = name(view.knocker);
    if (view.knocker === view.seat) {
      return {
        title: 'You knocked',
        detail: 'Everyone else gets one more turn, then the reveal.',
        tone: 'knock',
      };
    }
    if (mine) {
      const detail =
        view.hand.length > 3
          ? 'Last turn — tap a card to discard.'
          : 'This is your last turn. Draw from the deck or the discard.';
      return { title: `${who} knocked`, detail, tone: 'knock' };
    }
    return {
      title: `${who} knocked`,
      detail: 'One more turn each, then the reveal.',
      tone: 'knock',
    };
  }

  if (!mine) {
    return {
      title: `${name(view.turn)} is playing`,
      detail: 'Waiting for your turn.',
      tone: 'neutral',
    };
  }

  if (view.hand.length > 3) {
    return { title: 'Your turn', detail: 'Tap a card to discard.', tone: 'mine' };
  }

  if (view.legalActions.includes('knock')) {
    return {
      title: 'Your turn',
      detail: 'Your hand is complete — knock, or draw to improve it.',
      tone: 'mine',
      button: {
        label: 'KNOCK',
        onPress: onKnock,
        a11y: 'Knock. Skip your turn; everyone else gets one more turn, then the reveal',
      },
    };
  }

  return { title: 'Your turn', detail: 'Draw from the deck or the discard.', tone: 'mine' };
}

const TONES = StyleSheet.create({
  neutral: { borderColor: '#bbb' },
  mine: { borderColor: '#000' },
  knock: { borderColor: '#000', backgroundColor: '#fff3c4' },
  reveal: { borderColor: '#000', backgroundColor: '#eee' },
});

const styles = StyleSheet.create({
  island: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderWidth: 3,
    borderRadius: 10,
  },
  text: { flex: 1, gap: 2 },
  title: { fontWeight: '800', fontSize: 16 },
  titleKnock: { letterSpacing: 0.5 },
  detail: { fontSize: 13, color: '#222' },
  button: {
    minWidth: 96,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  pressed: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 1 },
});
