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

export function cardName(card: Card): string {
  return `${RANK_NAMES[card.rank]} of ${card.suit}`;
}

interface Props {
  card?: Card;
  faceDown?: boolean;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  label?: string;
}

/** Greybox card: a rectangle with text. Suit by name, never by colour alone. */
export function CardView({ card, faceDown, selected, disabled, onPress, label }: Props) {
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
        faceDown && styles.faceDown,
        selected && styles.selected,
        disabled && onPress && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.text} allowFontScaling maxFontSizeMultiplier={2}>
        {text}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 48,
    minHeight: 68,
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 6,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceDown: { backgroundColor: '#999' },
  selected: { borderColor: '#000', borderWidth: 4 },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.7 },
  text: { fontSize: 18, fontWeight: '600', color: '#111' },
});
