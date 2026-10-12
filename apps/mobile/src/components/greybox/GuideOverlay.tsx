import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { GuideStep } from '@/game/guide';
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
        <Text style={styles.title}>{step.title}</Text>
        <CardText style={styles.body}>{step.body}</CardText>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={onSkip} style={styles.skip}>
            <Text style={styles.skipText}>Skip the guide</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onDismiss} style={styles.ok}>
            <Text style={styles.okText}>Got it</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#000',
    padding: 18,
    gap: 12,
  },
  title: { fontSize: 20, fontWeight: '800' },
  body: { fontSize: 16, lineHeight: 22 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  skip: { paddingVertical: 10, paddingHorizontal: 6 },
  skipText: { fontSize: 14, color: '#555', textDecorationLine: 'underline' },
  ok: { paddingVertical: 12, paddingHorizontal: 22, borderRadius: 8, backgroundColor: '#000' },
  okText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
