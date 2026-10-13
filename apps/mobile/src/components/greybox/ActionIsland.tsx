import type { PlayerView } from '@thirtyone/rules';
import { Pressable, StyleSheet, View } from 'react-native';
import { ISLAND, PANEL } from '@/theme/components';
import { Txt, useFontScale } from '@/theme/text';
import { color, layout, radius, space } from '@/theme/tokens';

interface Props {
  view: PlayerView;
  onKnock(): void;
  onContinue(): void;
}

export type MomentAction = 'knock' | 'continue';

/** What the table is doing now: the island's title, its guide line, its tone and its one action. */
export interface Moment {
  title: string;
  detail: string;
  action?: MomentAction;
  tone: 'neutral' | 'mine' | 'knock' | 'reveal';
}

/** The one button style's two jobs: Knock when you may, Continue at the reveal. */
export const MOMENT_ACTIONS: Record<MomentAction, { label: string; a11y: string }> = {
  knock: {
    label: 'KNOCK',
    a11y: 'Knock. Your hand is complete: skip your turn; everyone else gets one more turn, then the reveal',
  },
  continue: { label: 'Continue', a11y: 'Continue to the next round' },
};

/**
 * The action island: always present above the opponents. It says what is
 * happening, what to do, and holds the one action the moment allows — Knock
 * when you may, Continue at the reveal.
 */
export function ActionIsland({ view, onKnock, onContinue }: Props) {
  const c = moment(view);
  const button = c.action ? MOMENT_ACTIONS[c.action] : null;
  const scale = useFontScale();
  const tone = TONES[c.tone];
  return (
    <View
      style={[styles.island, { backgroundColor: tone.bg, height: layout.islandHeight * scale }]}
      accessibilityLiveRegion="polite"
      accessible={!button}
      accessibilityLabel={button ? undefined : `${c.title}. ${c.detail}`}
    >
      <View style={styles.text}>
        <Txt variant="title" color={tone.fg}>
          {c.title}
        </Txt>
        <Txt variant="status" color={tone.fg}>
          {c.detail}
        </Txt>
      </View>
      {button ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={button.a11y}
          onPress={c.action === 'knock' ? onKnock : onContinue}
          style={({ pressed }) => [
            styles.button,
            // On the ink island the one button style gains a cream outline so it still reads as a button.
            { borderColor: c.tone === 'reveal' ? color.island.reveal.fg : color.ink },
            pressed && styles.pressed,
          ]}
        >
          <Txt variant="button" color={color.island.reveal.fg}>
            {button.label}
          </Txt>
        </Pressable>
      ) : null}
    </View>
  );
}

export function moment(view: PlayerView): Moment {
  const name = (seat: number) =>
    seat === view.seat ? 'You' : (view.seats[seat]?.id ?? `Seat ${seat}`);
  const mine = view.turn === view.seat;

  if (view.phase === 'roundOver' && view.roundResult) {
    const r = view.roundResult;
    // The knocker is already marked by their pill, so the title doesn't repeat it;
    // the outcome goes on the guide line.
    const title =
      r.reason === 'thirtyOne'
        ? `${r.thirtyOneSeats.map(name).join(' and ')} ${r.thirtyOneSeats.length > 1 || r.thirtyOneSeats[0] === view.seat ? 'have' : 'has'} 31!`
        : 'Hands revealed';
    return {
      title,
      detail: outcome(view, name),
      tone: 'reveal',
      action: 'continue',
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
      detail: 'Draw from the deck or the discard.',
      tone: 'mine',
      action: 'knock',
    };
  }

  return { title: 'Your turn', detail: 'Draw from the deck or the discard.', tone: 'mine' };
}

/**
 * The guide line your panel carries when the island is off: the island's
 * guide, except that while someone else's knock still leaves you a turn it
 * says so.
 */
export function panelGuide(view: PlayerView): string {
  const m = moment(view);
  const k = view.knocker;
  if (view.phase === 'playing' && k !== null && k !== view.seat) {
    // Play moves to higher seats; everyone after the knocker gets one turn.
    const n = view.seats.length;
    const after = (s: number) => (s - k + n) % n;
    if (after(view.seat) >= after(view.turn)) {
      const who = view.seats[k]?.id ?? `Seat ${k}`;
      return `${who} knocked — this is your last turn.`;
    }
  }
  return m.detail;
}

/** The reveal's guide line: who is lowest and what it costs. */
function outcome(view: PlayerView, name: (seat: number) => string): string {
  const r = view.roundResult!;
  if (r.reason === 'thirtyOne') return 'Everyone else folds a corner.';
  if (r.penalties.length === 0) return 'Nobody folds.';
  if (r.penalties.length === 1) {
    const p = r.penalties[0]!;
    const you = p.seat === view.seat;
    const who = name(p.seat);
    if (p.corners === 2)
      return you
        ? 'You knocked and are lowest — fold two.'
        : `${who} knocked and is lowest — folds two.`;
    return you ? 'You are lowest — fold a corner.' : `${who} is lowest — folds a corner.`;
  }
  const losers = r.penalties.map((p) => name(p.seat));
  return `${losers.join(' and ')} ${losers.length > 1 || losers[0] === 'You' ? 'fold' : 'folds'} a corner.`;
}

const TONES = {
  neutral: color.island.neutral,
  mine: color.island.yourTurn,
  knock: color.island.knock,
  reveal: color.island.reveal,
} as const;

const styles = StyleSheet.create({
  island: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    marginTop: ISLAND.marginTop,
    marginHorizontal: PANEL.gutter,
    paddingLeft: ISLAND.padLeft,
    paddingRight: ISLAND.padRight,
    borderRadius: radius.panel,
    overflow: 'hidden',
  },
  text: { flex: 1, gap: 2 },
  button: {
    minHeight: ISLAND.button.height,
    justifyContent: 'center',
    paddingHorizontal: ISLAND.button.padH,
    borderRadius: ISLAND.button.radius,
    borderWidth: ISLAND.button.border,
    backgroundColor: color.ink,
  },
  pressed: { opacity: 0.7 },
});
