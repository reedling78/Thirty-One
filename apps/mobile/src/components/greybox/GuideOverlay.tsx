import { Pressable, StyleSheet, View } from 'react-native';
import type { GuideStep } from '@/game/guide';
import { SCRIM } from '@/theme/components';
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
        <Txt variant="title" color={color.ink}>
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
          <Pressable accessibilityRole="button" onPress={onDismiss} style={styles.ok}>
            <Txt variant="button" color={color.paper}>
              Got it
            </Txt>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: SCRIM,
    justifyContent: 'center',
    padding: space.xl,
  },
  card: {
    backgroundColor: color.paper,
    borderRadius: radius.panel,
    padding: space.xl,
    gap: space.md,
    ...shadow.lifted,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: space.xs,
  },
  skip: { paddingVertical: space.md },
  skipText: { textDecorationLine: 'underline' },
  ok: {
    paddingVertical: space.md,
    paddingHorizontal: space.xl,
    borderRadius: radius.card,
    backgroundColor: color.ink,
  },
});
