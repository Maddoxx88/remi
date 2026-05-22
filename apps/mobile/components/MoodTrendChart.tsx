import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Line, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors, Fonts, Spacing, Radius } from '../services/theme';
import { MoodDayPoint } from '../services/insightsAnalytics';
import { Mood } from '../services/api';

const CHART_HEIGHT = 120;
const PADDING_X = 12;
const PADDING_Y = 16;

const MOOD_DOT: Record<Mood, string> = {
  energized: Colors.energized,
  focused: Colors.focused,
  creative: Colors.creative,
  reflective: Colors.reflective,
  scattered: Colors.scattered,
  anxious: Colors.anxious,
  overwhelmed: Colors.overwhelmed,
  stressed: Colors.stressed,
};

interface Props {
  points: MoodDayPoint[];
}

export default function MoodTrendChart({ points }: Props) {
  const width = Dimensions.get('window').width - Spacing.lg * 2 - Spacing.lg * 2;
  const innerW = width - PADDING_X * 2;
  const innerH = CHART_HEIGHT - PADDING_Y * 2;
  const minScore = 15;
  const maxScore = 95;

  const scoredIndices = points
    .map((p, i) => (p.score !== null ? i : -1))
    .filter(i => i >= 0);

  const xAt = (index: number) =>
    PADDING_X + (points.length <= 1 ? innerW / 2 : (index / (points.length - 1)) * innerW);

  const yAt = (score: number) =>
    PADDING_Y + innerH - ((score - minScore) / (maxScore - minScore)) * innerH;

  let linePath = '';
  let areaPath = '';
  if (scoredIndices.length >= 1) {
    const segments: string[] = [];
    scoredIndices.forEach((idx, segI) => {
      const p = points[idx];
      if (p.score === null) return;
      const x = xAt(idx);
      const y = yAt(p.score);
      segments.push(`${segI === 0 ? 'M' : 'L'} ${x} ${y}`);
    });
    linePath = segments.join(' ');

    if (scoredIndices.length >= 2) {
      const first = scoredIndices[0];
      const last = scoredIndices[scoredIndices.length - 1];
      const baseY = PADDING_Y + innerH;
      areaPath = `${linePath} L ${xAt(last)} ${baseY} L ${xAt(first)} ${baseY} Z`;
    }
  }

  const hasData = scoredIndices.length > 0;

  return (
    <View style={styles.wrap}>
      <View style={[styles.chartBox, { width }]}>
        {!hasData ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No dumps in the last 7 days</Text>
          </View>
        ) : (
          <Svg width={width} height={CHART_HEIGHT}>
            <Defs>
              <LinearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={Colors.teal} stopOpacity="0.45" />
                <Stop offset="100%" stopColor={Colors.teal} stopOpacity="0.02" />
              </LinearGradient>
            </Defs>
            {[0.25, 0.5, 0.75].map(frac => (
              <Line
                key={frac}
                x1={PADDING_X}
                y1={PADDING_Y + innerH * (1 - frac)}
                x2={width - PADDING_X}
                y2={PADDING_Y + innerH * (1 - frac)}
                stroke={Colors.border}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            ))}
            {areaPath ? <Path d={areaPath} fill="url(#moodFill)" /> : null}
            {linePath && scoredIndices.length >= 2 ? (
              <Path
                d={linePath}
                stroke={Colors.nameAccent}
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
            {points.map((p, i) => {
              if (p.score === null || !p.mood) return null;
              const x = xAt(i);
              const y = yAt(p.score);
              const fill = MOOD_DOT[p.mood] ?? Colors.teal;
              return (
                <Circle
                  key={p.dateKey}
                  cx={x}
                  cy={y}
                  r={scoredIndices.length === 1 ? 6 : 5}
                  fill={fill}
                  stroke={Colors.bgCard}
                  strokeWidth={2}
                />
              );
            })}
          </Svg>
        )}
      </View>
      <View style={[styles.labels, { width }]}>
        {points.map(p => (
          <Text key={p.dateKey} style={styles.dayLabel}>
            {p.shortLabel}
          </Text>
        ))}
      </View>
      <Text style={styles.caption}>Higher = calmer · based on mood per day</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  chartBox: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    minHeight: CHART_HEIGHT,
    justifyContent: 'center',
  },
  empty: {
    height: CHART_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingHorizontal: 4,
  },
  dayLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.textDim,
    flex: 1,
    textAlign: 'center',
  },
  caption: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textDim,
    marginTop: Spacing.xs,
    alignSelf: 'flex-start',
  },
});
