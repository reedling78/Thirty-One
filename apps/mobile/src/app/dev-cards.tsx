import { RANKS, SUITS, type Card } from '@thirtyone/rules';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { CardView, GreyscaleCards, type CardSize } from '@/components/greybox/CardView';
import { Felt } from '@/components/ui/Felt';
import { PANEL } from '@/theme/components';
import { Txt } from '@/theme/text';
import { color, space, type BackColor } from '@/theme/tokens';

const SIZES: readonly CardSize[] = ['small', 'normal', 'large'];
const BACKS = Object.keys(color.back) as BackColor[];

/**
 * Developer card sheet: every rank and suit at every size, and the four backs,
 * in colour or greyscale. Checks the faces against the canvas and that suits
 * still read without colour. Reachable from Settings › Developer in dev builds.
 */
export default function DevCardsScreen() {
  const [greyscale, setGreyscale] = useState(false);
  if (!__DEV__) return <Redirect href="/" />;
  return (
    <Felt pool={false}>
      <ScrollView contentContainerStyle={styles.root}>
        <View style={styles.toggle}>
          <Txt variant="label" color={color.onBaize}>
            Greyscale
          </Txt>
          <Switch
            value={greyscale}
            onValueChange={setGreyscale}
            trackColor={{ true: color.ink, false: color.rule }}
            thumbColor={color.cardFace}
            accessibilityLabel="Greyscale"
          />
        </View>
        <GreyscaleCards.Provider value={greyscale}>
          {SIZES.map((size) => (
            <View key={size} style={styles.section}>
              <Txt variant="title" color={color.onBaize}>
                {size}
              </Txt>
              {SUITS.map((suit) => (
                <View key={suit} style={styles.row}>
                  {RANKS.map((rank) => {
                    const card: Card = { rank, suit };
                    return <CardView key={rank} card={card} size={size} />;
                  })}
                </View>
              ))}
              <View style={styles.row}>
                {BACKS.map((b) => (
                  <CardView key={b} faceDown size={size} back={b} label={`${b} card back`} />
                ))}
              </View>
            </View>
          ))}
        </GreyscaleCards.Provider>
      </ScrollView>
    </Felt>
  );
}

const styles = StyleSheet.create({
  root: { padding: PANEL.gutter, gap: space.xxl, paddingBottom: space.xxxl },
  toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  section: { gap: space.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
