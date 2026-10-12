import { AtkinsonHyperlegible_400Regular } from '@expo-google-fonts/atkinson-hyperlegible/400Regular';
import { AtkinsonHyperlegible_700Bold } from '@expo-google-fonts/atkinson-hyperlegible/700Bold';
import { BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque/700Bold';
import { BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque/800ExtraBold';

/**
 * The four faces the design uses, registered under the family names in `tokens.type`.
 * Imported per weight so only these four files are bundled.
 */
export const FONTS = {
  'BricolageGrotesque-Bold': BricolageGrotesque_700Bold,
  'BricolageGrotesque-ExtraBold': BricolageGrotesque_800ExtraBold,
  'AtkinsonHyperlegible-Regular': AtkinsonHyperlegible_400Regular,
  'AtkinsonHyperlegible-Bold': AtkinsonHyperlegible_700Bold,
} as const;

export type FontFamily = keyof typeof FONTS;
