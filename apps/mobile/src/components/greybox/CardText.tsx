import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import { Txt, type TypeName } from '@/theme/text';
import { color, type as typeTokens } from '@/theme/tokens';

const CARD_TOKEN = /(10|[2-9AJQK])([♣♦♥♠])/g;

interface Props {
  children: string;
  style?: StyleProp<TextStyle>;
  variant?: TypeName;
  /** Base text colour; card mentions take their suit colour. */
  color?: string;
  bold?: boolean;
}

/**
 * Plain text with any card mentions ("9♥", "10♠") rendered bold and in their
 * suit colour. Hearts and diamonds red, clubs and spades black — on top of the
 * symbol, never instead of it. Only for text on paper: suit red fails on baize.
 */
export function CardText({ children, style, variant = 'status', color: base, bold }: Props) {
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
  return (
    <Txt variant={variant} color={base} bold={bold} style={style}>
      {parts}
    </Txt>
  );
}

const styles = StyleSheet.create({
  card: { fontFamily: typeTokens.label.family, color: color.suitBlack },
  red: { color: color.suitRed },
});
