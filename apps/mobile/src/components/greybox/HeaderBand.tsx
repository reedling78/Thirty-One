import type { PlayerView } from '@thirtyone/rules';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { BAND } from '@/theme/components';
import { Txt, useFontScale } from '@/theme/text';
import { color } from '@/theme/tokens';

export type MomentAction = 'knock' | 'deal';

/** What the table is doing now: the band's headline, its guide line, its tone and its one action. */
export interface Moment {
  title: string;
  detail: string;
  action?: MomentAction;
  tone: 'neutral' | 'mine' | 'knock' | 'reveal';
}

/** The one button style's two jobs: Knock when you may, Deal at the reveal. */
const ACTIONS: Record<MomentAction, { label: string; a11y: string }> = {
  knock: {
    label: 'KNOCK',
    a11y: 'Knock. Your hand is complete: skip your turn; everyone else gets one more turn, then the reveal',
  },
  deal: { label: 'Deal', a11y: 'Deal the next round' },
};

/**
 * The longest headline and guide line the band can show in play, with a long
 * seat name. Laid out invisibly, they set the band's height so it never changes
 * between states, at any text size. (Two seats dealt 31 at once — "bot1 and
 * bot3 have 31!" — can still wrap the headline; that round is rare enough not
 * to reserve a line for.)
 */
const LONGEST_TITLE = 'bot9 is playing';
const LONGEST_GUIDE = 'This is your last turn. Draw from the deck or the discard.';

interface Props {
  /** The table, or null before the first deal (the band then says "Dealing…"). */
  view: PlayerView | null;
  onKnock?: () => void;
  onDeal?: () => void;
}

/**
 * The table's navigation bar is the action island: a full-width band in the
 * moment's tone, up behind the status bar, with the back chevron, the headline
 * over one guide line, and the one action the moment allows — KNOCK when you
 * may, Deal at the reveal. On your turn the whole top of the phone goes gold.
 * Announced as a status to screen readers.
 */
export function HeaderBand({ view, onKnock, onDeal }: Props) {
  const router = useRouter();
  const scale = useFontScale();
  const insets = useSafeAreaInsets();
  const m: Moment = view
    ? moment(view)
    : { title: 'Dealing…', detail: 'Next round coming up.', tone: 'neutral' };
  const tone = TONES[m.tone];
  const button = m.action ? ACTIONS[m.action] : null;
  const onPress = m.action === 'knock' ? onKnock : onDeal;
  const titleStyle = {
    fontSize: BAND.title.size * scale,
    lineHeight: BAND.title.lineHeight * scale,
    letterSpacing: BAND.title.letterSpacing,
  };
  const guideStyle = {
    fontSize: BAND.guide.size * scale,
    lineHeight: BAND.guide.lineHeight * scale,
  };
  return (
    // The band hugs its content: the status-bar inset, 6 pt, headline over guide, 10 pt.
    <View
      style={[styles.band, { backgroundColor: tone.bg, paddingTop: insets.top + BAND.pad.top }]}
      accessibilityLiveRegion="polite"
    >
      {/* Dark status-bar text on the light tones, light on the dark ones. */}
      <StatusBar style={m.tone === 'knock' || m.tone === 'reveal' ? 'light' : 'dark'} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}
      >
        <Svg width={BAND.chevron.size} height={BAND.chevron.size} viewBox="0 0 24 24">
          <Path
            d={BAND.chevron.path}
            fill="none"
            stroke={tone.fg}
            strokeWidth={BAND.chevron.stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Pressable>
      <View style={styles.text}>
        <View
          style={[styles.lines, styles.ghost]}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Txt variant="display" style={titleStyle}>
            {LONGEST_TITLE}
          </Txt>
          <Txt variant="body" style={guideStyle}>
            {LONGEST_GUIDE}
          </Txt>
        </View>
        <View
          style={[styles.lines, styles.overlay]}
          accessible
          accessibilityRole="summary"
          accessibilityLabel={m.detail ? `${m.title}. ${m.detail}` : m.title}
        >
          <Txt variant="display" color={tone.fg} style={titleStyle}>
            {m.title}
          </Txt>
          <Txt variant="body" color={tone.fg} style={guideStyle}>
            {m.detail}
          </Txt>
        </View>
      </View>
      {/* The slot always keeps the wider button's room, so the lines never reflow as it comes and goes. */}
      <View style={styles.slot}>
        <View
          style={[styles.button, styles.ghost, styles.ghostButton]}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {Object.values(ACTIONS).map((a) => (
            <Txt key={a.label} variant="button">
              {a.label}
            </Txt>
          ))}
        </View>
        {button ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={button.a11y}
            onPress={onPress}
            style={({ pressed }) => [
              styles.button,
              styles.live,
              // On the ink tone the one button style gains a cream outline so it still reads as a button.
              { borderColor: m.tone === 'reveal' ? color.island.reveal.fg : color.ink },
              pressed && styles.pressed,
            ]}
          >
            <Txt variant="button" color={color.island.reveal.fg}>
              {button.label}
            </Txt>
          </Pressable>
        ) : null}
      </View>
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
      action: 'deal',
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
  band: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BAND.gap,
    paddingRight: BAND.pad.right,
    paddingBottom: BAND.pad.bottom,
    paddingLeft: BAND.pad.left,
  },
  back: {
    width: BAND.back,
    height: BAND.back,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, minWidth: 0 },
  lines: { gap: BAND.lineGap },
  ghost: { opacity: 0 },
  overlay: { ...StyleSheet.absoluteFill },
  slot: { minHeight: BAND.button.height, justifyContent: 'center' },
  button: {
    minHeight: BAND.button.height,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: BAND.button.padH,
    borderRadius: BAND.button.radius,
    borderWidth: BAND.button.border,
    borderColor: color.ink,
    backgroundColor: color.ink,
  },
  // Sized by the wider label; no height of its own.
  ghostButton: { height: 0, minHeight: 0, overflow: 'hidden', borderWidth: 0 },
  live: { position: 'absolute', right: 0, top: 0, bottom: 0 },
  pressed: { opacity: 0.7 },
});
