import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

const CARD_TOKEN = /(10|[2-9AJQK])([♣♦♥♠])/g;

interface Props {
  children: string;
  style?: StyleProp<TextStyle>;
}

/**
 * Plain text with any card mentions ("9♥", "10♠") rendered bold and in their
 * suit colour. Hearts and diamonds red, clubs and spades black — on top of the
 * symbol, never instead of it.
 */
export function CardText({ children, style }: Props) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of children.matchAll(CARD_TOKEN)) {
    const start = m.index ?? 0;
    if (start > last) parts.push(children.slice(last, start));
    const red = m[2] === '♥' || m[2] === '♦';
    parts.push(
      <Text key={start} style={[styles.card, red && styles.red]}>
        {m[0]}
      </Text>,
    );
    last = start + m[0].length;
  }
  if (last < children.length) parts.push(children.slice(last));
  return <Text style={style}>{parts}</Text>;
}

const styles = StyleSheet.create({
  card: { fontWeight: '700', color: '#111' },
  red: { color: '#c0392b' },
});
