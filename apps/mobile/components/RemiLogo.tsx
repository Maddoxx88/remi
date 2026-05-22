import Svg, { Circle, G } from 'react-native-svg';
import { Colors } from '../services/theme';

interface RemiLogoProps {
  size?: number;
  color?: string;
}

/** Spiral mark — outer ring + inner arc */
export default function RemiLogo({ size = 40, color = Colors.accent }: RemiLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <G rotation={-32} origin="50, 50">
        <Circle
          cx="50"
          cy="50"
          r="36"
          stroke={color}
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="198 30"
        />
        <Circle
          cx="50"
          cy="50"
          r="22"
          stroke={color}
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="118 55"
        />
      </G>
    </Svg>
  );
}
