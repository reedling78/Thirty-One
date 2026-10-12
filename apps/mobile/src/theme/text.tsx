import { useSyncExternalStore } from 'react';
import {
  PixelRatio,
  Text,
  useWindowDimensions,
  type TextProps,
  type TextStyle,
} from 'react-native';
import { type as typeTokens } from './tokens';

export type TypeName = keyof typeof typeTokens;

/** The bold face of each family, for a bold run inside a regular style. */
const BOLD: Record<string, string> = {
  'AtkinsonHyperlegible-Regular': 'AtkinsonHyperlegible-Bold',
  'AtkinsonHyperlegible-Bold': 'AtkinsonHyperlegible-Bold',
  'BricolageGrotesque-Bold': 'BricolageGrotesque-ExtraBold',
  'BricolageGrotesque-ExtraBold': 'BricolageGrotesque-ExtraBold',
};

/**
 * Developer override for the text size, so large-text layouts can be checked
 * where the system size can't be changed (the web preview). Dev builds only;
 * null means "use the system size".
 */
let devScale: number | null = null;
const devListeners = new Set<() => void>();
export function setDevFontScale(scale: number | null) {
  if (!__DEV__) return;
  devScale = scale;
  devListeners.forEach((l) => l());
}
if (__DEV__)
  (globalThis as { __setFontScale?: typeof setDevFontScale }).__setFontScale = setDevFontScale;
function subscribeDevScale(l: () => void) {
  devListeners.add(l);
  return () => devListeners.delete(l);
}
export function useDevFontScale(): number | null {
  return useSyncExternalStore(subscribeDevScale, () => devScale);
}

/**
 * The system text size. Reading the window dimensions re-renders the caller
 * when the player changes it in Settings, so layouts follow without a restart.
 */
export function useFontScale(): number {
  useWindowDimensions();
  const override = useDevFontScale();
  return override ?? PixelRatio.getFontScale();
}

/** A type token at the current text size. Text using it must not scale again (allowFontScaling={false}). */
export function scaledType(name: TypeName, scale: number, bold = false): TextStyle {
  const t: { family: string; size: number; lineHeight: number; letterSpacing?: number } =
    typeTokens[name];
  return {
    fontFamily: bold ? BOLD[t.family] : t.family,
    fontSize: t.size * scale,
    lineHeight: t.lineHeight * scale,
    letterSpacing: t.letterSpacing,
  };
}

interface Props extends TextProps {
  variant: TypeName;
  color?: string;
  bold?: boolean;
  /** For text on fixed-size objects (cards, chips, the ad slot) that must not grow. */
  fixed?: boolean;
}

/**
 * Text in one of the design's type styles. Every style is multiplied by the
 * system text size here, once; the native scaling is turned off so it never
 * applies twice.
 */
export function Txt({ variant, color, bold, fixed, style, ...rest }: Props) {
  const scale = useFontScale();
  return (
    <Text
      {...rest}
      allowFontScaling={false}
      style={[scaledType(variant, fixed ? 1 : scale, bold), color ? { color } : null, style]}
    />
  );
}
