import { cardLabel, type Card } from '@thirtyone/rules';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SIZE } from '@/theme/cardArt';
import { color, radius, type as typeTokens } from '@/theme/tokens';

const RANK_NAMES: Record<Card['rank'], string> = {
  A: 'Ace',
  '2': 'Two',
  '3': 'Three',
  '4': 'Four',
  '5': 'Five',
  '6': 'Six',
  '7': 'Seven',
  '8': 'Eight',
  '9': 'Nine',
  '10': 'Ten',
  J: 'Jack',
  Q: 'Queen',
  K: 'King',
};

/** Hearts and diamonds are red, clubs and spades black. Colour is additive: the suit symbol carries the meaning. */
export function isRed(suit: Card['suit']): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}

export function cardName(card: Card): string {
  return `${RANK_NAMES[card.rank]} of ${card.suit}`;
}

export type CardSize = 'small' | 'normal' | 'large';

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
}

/** Greybox card: a rectangle with text. Suit by name, never by colour alone. */
export function CardView({
  card,
  size = 'normal',
  faceDown,
  selected,
  disabled,
  dimmed,
  onPress,
  label,
}: Props) {
  const text = faceDown || !card ? '▪' : cardLabel(card);
  const a11y = label ?? (faceDown || !card ? 'Face-down card' : cardName(card));
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'image'}
      accessibilityLabel={a11y}
      accessibilityState={{ disabled: !!disabled, selected: !!selected }}
      disabled={disabled || !onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        SIZES[size],
        faceDown && styles.faceDown,
        selected && styles.selected,
        ((disabled && onPress) || dimmed) && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[styles.text, TEXT_SIZES[size], !faceDown && card && isRed(card.suit) && styles.red]}
        allowFontScaling={false}
      >
        {text}
      </Text>
    </Pressable>
  );
}

// Cards never text-scale.
const SIZES = StyleSheet.create({
  small: {
    width: SIZE.small.w,
    height: SIZE.small.h,
    borderRadius: SIZE.small.radius,
    borderColor: SIZE.small.border,
  },
  normal: { width: SIZE.normal.w, height: SIZE.normal.h, borderRadius: SIZE.normal.radius },
  large: { width: SIZE.large.w, height: SIZE.large.h, borderRadius: SIZE.large.radius },
});
const TEXT_SIZES = StyleSheet.create({
  small: { fontSize: SIZE.small.index.font },
  normal: { fontSize: SIZE.normal.index.font },
  large: { fontSize: SIZE.large.index.font },
});

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: SIZE.normal.border,
    borderRadius: radius.md,
    backgroundColor: color.cardFace,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceDown: { backgroundColor: color.back.blue },
  selected: { borderColor: color.ink },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.7 },
  text: { fontFamily: typeTokens.title.family, color: color.suitBlack },
  red: { color: color.suitRed },
});
