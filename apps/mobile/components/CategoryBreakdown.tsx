import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Spacing, Radius } from '../services/theme';
import { CategoryStat } from '../services/insightsAnalytics';
import { Task } from '../services/api';

const BAR_COLORS: Record<Task['category'], string> = {
  work: Colors.nameAccent,
  personal: Colors.heroBlue,
  health: Colors.teal,
  finance: Colors.medium,
  creative: Colors.creative,
  social: Colors.reflective,
  admin: Colors.textDim,
};

interface Props {
  stats: CategoryStat[];
}

export default function CategoryBreakdown({ stats }: Props) {
  if (stats.length === 0) {
    return (
      <Text style={styles.empty}>Process a dump to see where your tasks cluster.</Text>
    );
  }

  const top = stats.slice(0, 5);
  const maxCount = top[0]?.count ?? 1;

  return (
    <View style={styles.wrap}>
      {top.map(stat => {
        const widthPct = Math.max(12, (stat.count / maxCount) * 100);
        const color = BAR_COLORS[stat.category] ?? Colors.sageDark;
        return (
          <View key={stat.category} style={styles.row}>
            <View style={styles.rowHeader}>
              <Text style={styles.label}>{stat.label}</Text>
              <Text style={styles.meta}>
                {stat.count} · {stat.percent}%
              </Text>
            </View>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${widthPct}%`, backgroundColor: color },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.md },
  row: { gap: 6 },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.text,
  },
  meta: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.textDim,
  },
  track: {
    height: 10,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  empty: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 21,
  },
});
