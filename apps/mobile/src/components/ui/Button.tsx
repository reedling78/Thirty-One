import { Pressable, StyleSheet, type PressableProps } from 'react-native';
import { BUTTON } from '@/theme/components';
import { Txt } from '@/theme/text';
import { color } from '@/theme/tokens';

interface Props extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  /** Primary is always ink with cream text; secondary takes the outline colour of its ground. */
  variant?: 'primary' | 'secondary';
  ground?: 'baize' | 'paper';
  size?: keyof typeof BUTTON.height;
}

/**
 * The design's two buttons. Works as the child of an expo-router `<Link asChild>`:
 * props pass straight through to the Pressable and its style is one flat object.
 */
export function Button({
  label,
  variant = 'secondary',
  ground = 'paper',
  size = 'regular',
  ...rest
}: Props) {
  const primary = variant === 'primary';
  const outline = primary ? color.ink : ground === 'baize' ? color.onBaize : color.ink;
  const text = primary ? color.paper : outline;
  return (
    <Pressable
      accessibilityRole="button"
      {...rest}
      style={({ pressed }) =>
        StyleSheet.flatten([
          styles.button,
          {
            minHeight: BUTTON.height[size],
            borderRadius: size === 'hero' ? BUTTON.radius.hero : BUTTON.radius.regular,
            borderColor: outline,
            backgroundColor: primary ? color.ink : 'transparent',
          },
          pressed && styles.pressed,
        ])
      }
    >
      <Txt variant="button" color={text} style={styles.label}>
        {label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: BUTTON.border,
    paddingHorizontal: BUTTON.padH,
  },
  label: { textAlign: 'center' },
  pressed: { opacity: 0.7 },
});
