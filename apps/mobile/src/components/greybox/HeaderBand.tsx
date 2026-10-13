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

/** The one button's two jobs: Knock when you may, Deal at the reveal. It sits beside the discard. */
export const MOMENT_ACTIONS: Record<MomentAction, { label: string; a11y: string }> = {
  knock: {
    label: 'KNOCK',
    a11y: 'Knock. Your hand is complete: skip your turn; everyone else gets one more turn, then the reveal',
  },
  deal: { label: 'Deal', a11y: 'Deal the next round' },
};

/**
 * Every guide line the band can show. Each fits one line beside the chevron at
 * 1.3× text on a 375 pt phone, so the band is always two lines.
 * `who` is a seat name (up to "bot9") or "You".
 */
const GUIDE = {
  draw: 'Draw a card.',
  discard: 'Discard one card.',
  waiting: 'Wait for your turn.',
  dealing: 'Next round coming.',
  oneMoreTurn: 'One more turn each.',
  lastDraw: 'Last turn — draw.',
  lastDiscard: 'Last turn — discard.',
  thirtyOne: 'Everyone else folds a corner.',
  nobody: 'Nobody folds.',
  foldsTwo: (who: string) => (who === 'You' ? 'You fold two.' : `${who} folds two.`),
  foldsOne: (who: string) => (who === 'You' ? 'You fold a corner.' : `${who} folds a corner.`),
  twoFold: (a: string, b: string) => `${a} and ${b} fold.`,
  manyFold: (n: number) => `${n} players fold.`,
};

/**
 * The longest headline and guide line the band can show in play, with a long
 * seat name. Laid out invisibly, they set the band's height so it never changes
 * between states, at any text size. (Two seats dealt 31 at once — "bot1 and
 * bot3 have 31!" — can still wrap the headline; that round is rare enough not
 * to reserve a line for.)
 */
const LONGEST_TITLE = 'bot9 is playing';
const LONGEST_GUIDE = [
  ...Object.values(GUIDE).filter((g): g is string => typeof g === 'string'),
  GUIDE.foldsTwo('bot9'),
  GUIDE.foldsOne('bot9'),
  GUIDE.twoFold('bot9', 'bot9'),
  GUIDE.manyFold(10),
].reduce((a, b) => (b.length > a.length ? b : a));

interface Props {
  /** The table, or null before the first deal (the band then says "Dealing…"). */
  view: PlayerView | null;
}

/**
 * The table's navigation bar is the action island: a full-width band in the
 * moment's tone, up behind the status bar, holding only the back chevron and
 * the headline over one guide line (KNOCK and Deal sit beside the discard). On
 * your turn the whole top of the phone goes gold. Announced as a status to
 * screen readers. The screen hides the navigator's own header and renders this
 * as its first child.
 */
export function HeaderBand({ view }: Props) {
  const router = useRouter();
  const scale = useFontScale();
  const insets = useSafeAreaInsets();
  const m: Moment = view
    ? moment(view)
    : { title: 'Dealing…', detail: GUIDE.dealing, tone: 'neutral' };
  const tone = TONES[m.tone];
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
          accessibilityLabel={
            m.detail ? `${m.title}${/[!?…]$/.test(m.title) ? '' : '.'} ${m.detail}` : m.title
          }
        >
          <Txt variant="display" color={tone.fg} style={titleStyle}>
            {m.title}
          </Txt>
          <Txt variant="body" color={tone.fg} style={guideStyle}>
            {m.detail}
          </Txt>
        </View>
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
    return { title: 'Dealing…', detail: GUIDE.dealing, tone: 'neutral' };
  if (view.phase === 'gameOver') return { title: 'Game over', detail: '', tone: 'neutral' };
  if (view.phase === 'lobby') return { title: 'Waiting to start', detail: '', tone: 'neutral' };

  if (view.knocker !== null) {
    const who = name(view.knocker);
    if (view.knocker === view.seat) {
      return {
        title: 'You knocked',
        detail: GUIDE.oneMoreTurn,
        tone: 'knock',
      };
    }
    if (mine) {
      const detail = view.hand.length > 3 ? GUIDE.lastDiscard : GUIDE.lastDraw;
      return { title: `${who} knocked`, detail, tone: 'knock' };
    }
    return {
      title: `${who} knocked`,
      detail: GUIDE.oneMoreTurn,
      tone: 'knock',
    };
  }

  if (!mine) {
    return {
      title: `${name(view.turn)} is playing`,
      detail: GUIDE.waiting,
      tone: 'neutral',
    };
  }

  if (view.hand.length > 3) {
    return { title: 'Your turn', detail: GUIDE.discard, tone: 'mine' };
  }

  if (view.legalActions.includes('knock')) {
    return {
      title: 'Your turn',
      detail: GUIDE.draw,
      tone: 'mine',
      action: 'knock',
    };
  }

  return { title: 'Your turn', detail: GUIDE.draw, tone: 'mine' };
}

/**
 * The reveal's guide line: who folds and how much. The rows already mark who
 * was lowest and who knocked, so the line only says what it costs.
 */
function outcome(view: PlayerView, name: (seat: number) => string): string {
  const r = view.roundResult!;
  if (r.reason === 'thirtyOne') return GUIDE.thirtyOne;
  const losers = r.penalties.map((p) => name(p.seat));
  if (losers.length === 0) return GUIDE.nobody;
  if (losers.length === 1)
    return r.penalties[0]!.corners === 2 ? GUIDE.foldsTwo(losers[0]!) : GUIDE.foldsOne(losers[0]!);
  if (losers.length === 2) return GUIDE.twoFold(losers[0]!, losers[1]!);
  return GUIDE.manyFold(losers.length);
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
  pressed: { opacity: 0.7 },
});
