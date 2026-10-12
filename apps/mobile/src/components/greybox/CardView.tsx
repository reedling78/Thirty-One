import { cardLabel, type Card } from '@thirtyone/rules';
import { Pressable, StyleSheet, Text } from 'react-native';

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
        allowFontScaling
        maxFontSizeMultiplier={2}
      >
        {text}
      </Text>
    </Pressable>
  );
}

const SIZES = StyleSheet.create({
  small: { minWidth: 28, minHeight: 40, borderWidth: 1, borderRadius: 4 },
  normal: { minWidth: 48, minHeight: 68 },
  large: { minWidth: 88, minHeight: 126, borderRadius: 10 },
});
const TEXT_SIZES = StyleSheet.create({
  small: { fontSize: 12 },
  normal: { fontSize: 18 },
  large: { fontSize: 32 },
});

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 6,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceDown: { backgroundColor: '#999' },
  selected: { borderColor: '#000' },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.7 },
  text: { fontWeight: '600', color: '#111' },
  red: { color: '#c0392b' },
});
