import type { PlayerView } from '@thirtyone/rules';
import { StyleSheet, View } from 'react-native';
import { MOMENT_PILL } from '@/theme/components';
import { Txt, useFontScale } from '@/theme/text';
import { color } from '@/theme/tokens';
import { moment } from './ActionIsland';

interface Props {
  /** The table, or null before the first deal (the pill then says "Dealing…"). */
  view: PlayerView | null;
}

const QUIET = { bg: MOMENT_PILL.quiet.bg, fg: color.onBaize, ring: MOMENT_PILL.quiet.ring };

/** The island's tones as capsules on the felt: the reveal turns paper, a 31 turns gold. */
const TONES = {
  neutral: QUIET,
  mine: { ...color.island.yourTurn, ring: null },
  knock: { ...color.island.knock, ring: null },
  reveal: { bg: color.paper, fg: color.ink, ring: null },
  thirtyOne: { ...color.island.yourTurn, ring: null },
} as const;

/**
 * The header title: a capsule carrying the island's headline in the island's
 * tone — the first thing the eye lands on. With the island off it is the only
 * place the headline appears. Announced as a status to screen readers.
 */
export function MomentPill({ view }: Props) {
  const scale = useFontScale();
  const m = view ? moment(view) : null;
  const text = m?.title ?? 'Dealing…';
  const tone =
    m?.tone === 'reveal' && view?.roundResult?.reason === 'thirtyOne'
      ? TONES.thirtyOne
      : TONES[m?.tone ?? 'neutral'];
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
      accessibilityLabel={text}
      style={[
        styles.pill,
        { height: MOMENT_PILL.height * scale, backgroundColor: tone.bg },
        tone.ring ? { borderWidth: MOMENT_PILL.quiet.ringWidth, borderColor: tone.ring } : null,
      ]}
    >
      <Txt
        variant="callout"
        color={tone.fg}
        numberOfLines={1}
        style={{
          fontSize: MOMENT_PILL.font * scale,
          lineHeight: MOMENT_PILL.height * scale,
          letterSpacing: MOMENT_PILL.letterSpacing,
        }}
      >
        {text}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexShrink: 1,
    justifyContent: 'center',
    paddingHorizontal: MOMENT_PILL.padH,
    borderRadius: 999,
    overflow: 'hidden',
  },
});
