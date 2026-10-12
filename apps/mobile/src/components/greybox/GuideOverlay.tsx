import { Pressable, StyleSheet, View } from 'react-native';
import type { GuideStep } from '@/game/guide';
import { Button } from '@/components/ui/Button';
import { GUIDE, SCRIM } from '@/theme/components';
import { Txt } from '@/theme/text';
import { color, radius, shadow, space } from '@/theme/tokens';
import { CardText } from './CardText';

interface Props {
  step: GuideStep;
  onDismiss(): void;
  onSkip(): void;
}

/** A card over the table that explains the current moment. The table is dimmed behind it until "Got it". */
export function GuideOverlay({ step, onDismiss, onSkip }: Props) {
  return (
    <View style={styles.backdrop} accessibilityViewIsModal>
      <View style={styles.card} accessibilityRole="alert">
        <Txt variant="title" color={color.ink} accessibilityRole="header">
          {step.title}
        </Txt>
        <CardText variant="body" color={color.ink}>
          {step.body}
        </CardText>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={onSkip} style={styles.skip}>
            <Txt variant="body" color={color.inkSecondary} style={styles.skipText}>
              Skip the guide
            </Txt>
          </Pressable>
          <Button variant="primary" label="Got it" onPress={onDismiss} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: SCRIM,
    paddingHorizontal: space.xl,
    paddingTop: GUIDE.top,
  },
  card: {
    backgroundColor: color.paper,
    borderRadius: radius.panel,
    paddingTop: GUIDE.padTop,
    paddingHorizontal: space.xl,
    paddingBottom: space.xl,
    gap: space.md,
    ...shadow.lifted,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space.md,
    paddingTop: 6,
  },
  skip: { paddingVertical: space.md },
  skipText: { textDecorationLine: 'underline' },
});
