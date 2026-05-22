import Svg, { Circle, Path, Rect, G } from 'react-native-svg';
import { Colors } from '../services/theme';

const SIZE = 160;

interface Props {
  variant: 'history' | 'insights';
}

export default function TabEmptyIllustration({ variant }: Props) {
  if (variant === 'history') {
    return (
      <Svg width={SIZE} height={SIZE} viewBox="0 0 160 160">
        <Circle cx="80" cy="80" r="72" fill={Colors.sage} opacity={0.55} />
        <G transform="translate(32, 38)">
          <Rect x="0" y="24" width="72" height="88" rx="14" fill={Colors.bgCard} stroke={Colors.border} strokeWidth={2} />
          <Rect x="12" y="40" width="48" height="6" rx="3" fill={Colors.border} />
          <Rect x="12" y="54" width="40" height="6" rx="3" fill={Colors.bgElevated} />
          <Rect x="12" y="68" width="44" height="6" rx="3" fill={Colors.bgElevated} />
          <Rect x="12" y="88" width="28" height="14" rx={7} fill={Colors.tealSoft} />
        </G>
        <G transform="translate(78, 28)">
          <Rect x="0" y="16" width="56" height="72" rx="12" fill={Colors.bgCard} stroke={Colors.nameAccent} strokeWidth={2} />
          <Rect x="10" y="32" width="36" height="5" rx="2.5" fill={Colors.teal} />
          <Rect x="10" y="44" width="30" height="5" rx="2.5" fill={Colors.bgElevated} />
          <Circle cx="42" cy="68" r="14" fill={Colors.accent} opacity={0.9} />
          <Path
            d="M38 68 L41 71 L48 62"
            stroke={Colors.text}
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
        <Circle cx="124" cy="48" r="10" fill={Colors.heroBlueLight} />
        <Circle cx="36" cy="118" r="8" fill={Colors.teal} opacity={0.6} />
      </Svg>
    );
  }

  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 160 160">
      <Circle cx="80" cy="80" r="72" fill={Colors.tealSoft} opacity={0.5} />
      <Rect x="28" y="100" width="104" height="8" rx="4" fill={Colors.border} />
      <Path
        d="M36 100 L52 72 L68 82 L88 48 L108 58 L124 36"
        stroke={Colors.nameAccent}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="140"
        strokeDashoffset={0}
        opacity={0.35}
      />
      <Path
        d="M36 100 L52 72 L68 82 L88 48 L108 58"
        stroke={Colors.nameAccent}
        strokeWidth={3.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {[
        { cx: 52, cy: 72 },
        { cx: 68, cy: 82 },
        { cx: 88, cy: 48 },
        { cx: 108, cy: 58 },
      ].map((p, i) => (
        <Circle
          key={i}
          cx={p.cx}
          cy={p.cy}
          r={6}
          fill={Colors.bgCard}
          stroke={Colors.nameAccent}
          strokeWidth={2}
        />
      ))}
      <Rect x="44" y="28" width="72" height="52" rx="12" fill={Colors.bgCard} stroke={Colors.border} strokeWidth={2} />
      <Rect x="56" y="42" width="20" height="20" rx="6" fill={Colors.accent} opacity={0.85} />
      <Rect x="82" y="46" width="24" height="6" rx="3" fill={Colors.bgElevated} />
      <Rect x="82" y="58" width="16" height="6" rx="3" fill={Colors.border} />
      <Circle cx="120" cy="112" r="14" fill={Colors.accent} />
      <Path
        d="M114 112 L118 116 L128 104"
        stroke={Colors.text}
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
