import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { CALLOUT_TEXT, type CalloutKind } from '@/game/useRowCallouts';
import { useSettings } from '@/settings/Settings';
import { PANEL } from '@/theme/components';
import { Txt } from '@/theme/text';
import { color, layout } from '@/theme/tokens';

interface Props {
  kind: CalloutKind;
  /** The row's own state fill and bar, so the stamp reads as part of the row. */
  fill: string;
  bar: string | null;
}

/**
 * A stamp over a row's name-and-action block: KNOCKED! / FOLDS! / DOUBLE FOLDS! /
 * THIRTY ONE! in the row's fill, held for 3 s and faded over 0.6 s to show the
 * already-updated name and status. With reduce motion it is held, then simply
 * removed. The cards and chip beside it stay visible. Decorative to screen
 * readers — the announcement carries it.
 */
export function RowCallout({ kind, fill, bar }: Props) {
  const { motionReduced } = useSettings();
  const opacity = useSharedValue(1);
  useEffect(() => {
    if (!motionReduced)
      opacity.value = withDelay(
        layout.calloutHoldMs,
        withTiming(0, { duration: layout.calloutFadeMs }),
      );
  }, [motionReduced, opacity]);
  const fade = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const text = CALLOUT_TEXT[kind];
  return (
    <Animated.View
      style={[styles.stamp, { backgroundColor: fill }, fade]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {bar ? <View style={[styles.bar, { backgroundColor: bar }]} /> : null}
      <Txt variant={text.length > 8 ? 'calloutLong' : 'callout'} color={color.ink}>
        {text}
      </Txt>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Covers the name block out to the row's edges on the left, top and bottom, and
  // half the gap on the right, so the cards and chip are untouched.
  stamp: {
    position: 'absolute',
    left: -PANEL.rowPad.left,
    top: -PANEL.rowPad.top,
    bottom: -PANEL.rowPad.bottom,
    right: -PANEL.rowGap / 2,
    paddingLeft: PANEL.rowPad.left,
    justifyContent: 'center',
    zIndex: 1,
  },
  bar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: layout.stateBarWidth },
});
