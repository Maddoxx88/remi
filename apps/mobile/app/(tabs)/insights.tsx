import { useState, useCallback, type ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getHistory } from '../../services/storage';
import {
  computeInsights,
  formatClarityDisplay,
  InsightsSnapshot,
} from '../../services/insightsAnalytics';
import MoodTrendChart from '../../components/MoodTrendChart';
import CategoryBreakdown from '../../components/CategoryBreakdown';
import TabEmptyState from '../../components/TabEmptyState';
import { Colors, Fonts, Spacing, Radius } from '../../services/theme';

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={18} color={Colors.tabActive} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export default function InsightsScreen() {
  const [snapshot, setSnapshot] = useState<InsightsSnapshot | null>(null);
  const [hasHistory, setHasHistory] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getHistory().then(entries => {
        setHasHistory(entries.length > 0);
        setSnapshot(computeInsights(entries));
        setLoaded(true);
      });
    }, []),
  );

  if (!loaded) {
    return <SafeAreaView style={styles.safe} edges={['top']} />;
  }

  if (!hasHistory || !snapshot) {
    return <TabEmptyState variant="insights" />;
  }

  const clarityDisplay = formatClarityDisplay(snapshot.clarityMinutes);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Insights</Text>
          <Text style={styles.subtitle}>
            Last 7 days · {snapshot.dumpsLast7Days} dump
            {snapshot.dumpsLast7Days !== 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            label="Total dumps"
            value={String(snapshot.totalDumps)}
            icon="document-text-outline"
          />
          <StatCard
            label="Tasks extracted"
            value={String(snapshot.totalTasks)}
            icon="checkbox-outline"
          />
          <StatCard
            label="Hours of clarity"
            value={clarityDisplay}
            icon="time-outline"
          />
        </View>

        <Section title="Mood trend" subtitle="Last 7 days">
          <MoodTrendChart points={snapshot.moodTrend} />
        </Section>

        <Section
          title="Task categories"
          subtitle={
            snapshot.dumpsLast7Days > 0
              ? 'From dumps this week'
              : 'From all-time history'
          }
        >
          <CategoryBreakdown stats={snapshot.categories} />
        </Section>

        <Section title="Your patterns">
          <View style={styles.patterns}>
            {snapshot.patterns.map((line, i) => (
              <View key={i} style={styles.patternRow}>
                <View style={styles.patternDot} />
                <Text style={styles.patternText}>{line}</Text>
              </View>
            ))}
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 32,
    color: Colors.text,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'flex-start',
    gap: 4,
  },
  statValue: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    color: Colors.text,
    marginTop: 4,
  },
  statLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 14,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 17,
    color: Colors.text,
  },
  sectionSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textDim,
    marginTop: 2,
  },
  sectionBody: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  patterns: { gap: Spacing.md },
  patternRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  patternDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    marginTop: 6,
  },
  patternText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
});
