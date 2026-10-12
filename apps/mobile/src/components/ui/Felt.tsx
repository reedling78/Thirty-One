import { memo, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';
import { FELT } from '@/theme/components';
import { color } from '@/theme/tokens';

/** The baize nap, drawn once behind the screen. Decorative. */
const Nap = memo(function Nap({ pool }: { pool: boolean }) {
  const { fine, coarse } = FELT;
  const p = FELT.pool;
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id="fine" width={fine.period} height={fine.period} patternUnits="userSpaceOnUse">
          <Circle cx={fine.r} cy={fine.r} r={fine.r} fill={fine.color} />
        </Pattern>
        <Pattern
          id="coarse"
          x={coarse.dx}
          y={coarse.dy}
          width={coarse.period}
          height={coarse.period}
          patternUnits="userSpaceOnUse"
        >
          <Circle cx={coarse.r} cy={coarse.r} r={coarse.r} fill={coarse.color} />
        </Pattern>
        <RadialGradient
          id="pool"
          cx={`${p.cx * 100}%`}
          cy={`${p.cy * 100}%`}
          rx={`${p.rx * 100}%`}
          ry={`${p.ry * 100}%`}
        >
          <Stop offset="0" stopColor={p.color} stopOpacity={p.opacity} />
          <Stop offset="1" stopColor={p.color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {pool ? <Rect width="100%" height="100%" fill="url(#pool)" /> : null}
      <Rect width="100%" height="100%" fill="url(#fine)" />
      <Rect width="100%" height="100%" fill="url(#coarse)" />
    </Svg>
  );
});

interface Props {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** The soft pool of light at the top: on the table, Home and Results; not under a sheet. */
  pool?: boolean;
}

/** The screen ground: deep green baize with its felt speckle. */
export function Felt({ children, style, pool = true }: Props) {
  return (
    <View style={[styles.felt, style]}>
      <Nap pool={pool} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  felt: { flex: 1, backgroundColor: color.baize },
});
