import type { Card } from '@thirtyone/rules';
import { createContext, memo, useContext } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSettings } from '@/settings/Settings';
import {
  BACK,
  SIZE,
  SUIT,
  cardLabel,
  pipPositions,
  type CardSize,
  type Rank,
  type Suit,
} from '@/theme/cardArt';
import { CARD } from '@/theme/components';
import { color, shadow, type as typeTokens, type BackColor } from '@/theme/tokens';

export type { CardSize };

const SUIT_CODE: Record<Card['suit'], Suit> = {
  hearts: 'h',
  diamonds: 'd',
  clubs: 'c',
  spades: 's',
};

/** Hearts and diamonds are red, clubs and spades black. Colour is additive: the suit symbol carries the meaning. */
export function isRed(suit: Card['suit']): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}

/** Accessible name for a card: "Ace of hearts", "10 of spades". */
export function cardName(card: Card): string {
  return cardLabel(card.rank as Rank, SUIT_CODE[card.suit]);
}

/**
 * Renders every card face in greyscale. Only the dev card sheet sets it, to
 * check the faces survive without colour.
 */
export const GreyscaleCards = createContext(false);

function grey(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const l = Math.round(0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255));
  const h = l.toString(16).padStart(2, '0');
  return `#${h}${h}${h}`;
}

const LATTICE = {
  small: require('../../../assets/images/back/lattice-small.png'),
  normal: require('../../../assets/images/back/lattice-normal.png'),
  large: require('../../../assets/images/back/lattice-large.png'),
} as const;

interface Props {
  card?: Card;
  size?: CardSize;
  faceDown?: boolean;
  selected?: boolean;
  disabled?: boolean;
  /** Shown faded: the card is in hand but does not count. */
  dimmed?: boolean;
  onPress?: () => void;
  label?: string;
  /** Back colourway; defaults to the player's setting. */
  back?: BackColor;
}

/**
 * A playing card at one of three fixed sizes (cards never text-scale). Face:
 * mirrored indices and traditional pip layouts for 2–10, one big centre pip for
 * A, J, Q and K (the index letter tells them apart); the small size is a flat
 * icon card. Back: white stock and a
 * lattice panel in the player's colourway.
 */
export function CardView({
  card,
  size = 'normal',
  faceDown,
  selected,
  disabled,
  dimmed,
  onPress,
  label,
  back,
}: Props) {
  const { settings } = useSettings();
  const greyscale = useContext(GreyscaleCards);
  const down = faceDown || !card;
  const a11y = label ?? (down ? 'Face-down card' : cardName(card));
  const s = SIZE[size];
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'image'}
      accessibilityLabel={a11y}
      accessibilityState={onPress ? { disabled: !!disabled, selected: !!selected } : undefined}
      disabled={disabled || !onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { width: s.w, height: s.h, borderRadius: s.radius },
        size === 'large' ? shadow.pile : shadow.card,
        ((disabled && onPress) || dimmed) && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {down ? (
        <Back size={size} colour={back ?? settings.backColor} greyscale={greyscale} />
      ) : (
        <Face
          rank={card.rank as Rank}
          suit={SUIT_CODE[card.suit]}
          size={size}
          greyscale={greyscale}
        />
      )}
    </Pressable>
  );
}

const Back = memo(function Back({
  size,
  colour,
  greyscale,
}: {
  size: CardSize;
  colour: BackColor;
  greyscale: boolean;
}) {
  const s = SIZE[size];
  const panel = color.back[colour];
  return (
    <View
      style={[
        styles.stock,
        { borderRadius: s.radius, borderColor: SIZE.normal.border, padding: BACK.padding[size] },
      ]}
    >
      <ImageBackground
        source={LATTICE[size]}
        resizeMode="repeat"
        style={[
          styles.panel,
          {
            backgroundColor: greyscale ? grey(panel) : panel,
            borderRadius: BACK.innerRadius[size],
          },
        ]}
        imageStyle={[styles.tile, { borderRadius: BACK.innerRadius[size] }]}
      />
    </View>
  );
});

/** Suit pip as an SVG path in a 24×24 box, placed at (x, y) at `px` size, optionally upside down. */
function Pip({
  d,
  fill,
  x,
  y,
  px,
  flip,
}: {
  d: string;
  fill: string;
  x: number;
  y: number;
  px: number;
  flip?: boolean;
}) {
  const k = px / 24;
  const t = flip
    ? `translate(${x + px} ${y + px}) rotate(180) scale(${k})`
    : `translate(${x} ${y}) scale(${k})`;
  return <Path d={d} fill={fill} transform={t} />;
}

const Face = memo(function Face({
  rank,
  suit,
  size,
  greyscale,
}: {
  rank: Rank;
  suit: Suit;
  size: CardSize;
  greyscale: boolean;
}) {
  const tone = (hex: string) => (greyscale ? grey(hex) : hex);
  const pip = SUIT[suit].path;
  const ink = tone(SUIT[suit].color);

  if (size === 'small') {
    const s = SIZE.small;
    const rankStyle = [
      styles.smallRank,
      { color: ink, fontSize: s.index.font, lineHeight: s.index.font },
    ];
    return (
      <View style={[styles.stock, { borderRadius: s.radius, borderColor: s.border }]}>
        <Text
          allowFontScaling={false}
          style={[rankStyle, { top: s.index.inset, left: s.index.inset }]}
        >
          {rank}
        </Text>
        <Text
          allowFontScaling={false}
          style={[rankStyle, styles.flip, { bottom: s.index.inset, right: s.index.inset }]}
        >
          {rank}
        </Text>
        <Svg width={s.w} height={s.h} style={StyleSheet.absoluteFill}>
          <Pip d={pip} fill={ink} x={s.centrePip.x} y={s.centrePip.y} px={s.centrePip.size} />
        </Svg>
      </View>
    );
  }

  const s = SIZE[size];
  const bigPip = rank === 'A' || rank === 'J' || rank === 'Q' || rank === 'K';
  const index = (
    <View style={[styles.index, { gap: CARD.indexGap[size] }]}>
      <Text
        allowFontScaling={false}
        style={[styles.rank, { color: ink, fontSize: s.index.font, lineHeight: s.index.font }]}
      >
        {rank}
      </Text>
      <Svg width={s.index.pip} height={s.index.pip} viewBox="0 0 24 24">
        <Path d={pip} fill={ink} />
      </Svg>
    </View>
  );
  // Positions are measured inside the 1 dp border, as on the canvas.
  const inner = { w: s.w - 2, h: s.h - 2 };

  return (
    <View style={[styles.stock, { borderRadius: s.radius, borderColor: s.border }]}>
      <Svg width={inner.w} height={inner.h} style={styles.art}>
        {bigPip ? (
          <Pip d={pip} fill={ink} x={s.bigPip.x} y={s.bigPip.y} px={s.bigPip.size} />
        ) : (
          pipPositions(rank, size).map((p, i) => (
            <Pip key={i} d={pip} fill={ink} x={p.x} y={p.y} px={s.pip} flip={p.rotate === 180} />
          ))
        )}
      </Svg>
      <View style={[styles.corner, { top: s.index.inset, left: s.index.inset }]}>{index}</View>
      <View style={[styles.corner, styles.flip, { bottom: s.index.inset, right: s.index.inset }]}>
        {index}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { backgroundColor: color.cardFace },
  stock: {
    flex: 1,
    borderWidth: 1,
    backgroundColor: color.cardFace,
    overflow: 'hidden',
  },
  panel: { flex: 1, overflow: 'hidden' },
  // Without an explicit size the image takes one tile's intrinsic size and never repeats.
  tile: { width: '100%', height: '100%' },
  art: { position: 'absolute', left: 0, top: 0 },
  corner: { position: 'absolute' },
  index: { alignItems: 'center' },
  rank: { fontFamily: typeTokens.title.family, includeFontPadding: false },
  smallRank: {
    position: 'absolute',
    fontFamily: typeTokens.score.family,
    letterSpacing: CARD.smallRankLetterSpacing,
    includeFontPadding: false,
  },
  flip: { transform: [{ rotate: '180deg' }] },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.7 },
});
