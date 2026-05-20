import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getHistory, DumpEntry } from '../services/storage';
import { Task, ProcessedDump } from '../services/api';
import { Colors, Fonts, Spacing, Radius } from '../services/theme';
import MoodBadge from '../components/MoodBadge';
import TaskCard from '../components/TaskCard';

function getMoodGradient(mood: ProcessedDump['mood']): [string, string] {
  const map: Record<string, [string, string]> = {
    focused: ['#1A2E2C', '#0A0A0F'],
    overwhelmed: ['#2E1A1A', '#0A0A0F'],
    anxious: ['#2E251A', '#0A0A0F'],
    energized: ['#1E1A2E', '#0A0A0F'],
    scattered: ['#2E201A', '#0A0A0F'],
    reflective: ['#1A222E', '#0A0A0F'],
    stressed: ['#2E1A1A', '#0A0A0F'],
    creative: ['#241A2E', '#0A0A0F'],
  };
  return map[mood] || ['#12121A', '#0A0A0F'];
}

export default function ResultScreen() {
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const [entry, setEntry] = useState<DumpEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const history = await getHistory();
      const found = history.find((e) => e.id === entryId);
      setEntry(found || null);
      setLoading(false);
    }
    load();
  }, [entryId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.accent} size="large" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Entry not found.</Text>
      </View>
    );
  }

  const { result } = entry;
  const gradientColors = getMoodGradient(result.mood);

  return (
    <View style={styles.container}>
      <View style={[styles.gradient, { backgroundColor: gradientColors[0] }]} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={Colors.textMuted} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Clarity</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Mood + Summary */}
        <View style={styles.section}>
          <MoodBadge mood={result.mood} large />
          <Text style={styles.summary}>{result.summary}</Text>
        </View>

        {/* Focus Card */}
        <View style={styles.focusCard}>
          <View style={styles.focusHeader}>
            <Ionicons name="flash" size={16} color={Colors.accent} />
            <Text style={styles.focusLabel}>Focus on this first</Text>
          </View>
          <Text style={styles.focusTitle}>{result.focusItem.title}</Text>
          <Text style={styles.focusReason}>{result.focusItem.reason}</Text>
        </View>

        {/* Tasks */}
        {result.tasks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tasks</Text>
              <Text style={styles.sectionCount}>{result.tasks.length}</Text>
            </View>
            {result.tasks.map((task: Task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </View>
        )}

        {/* Insights */}
        {result.insights.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Remi's Observations</Text>
            </View>
            {result.insights.map((insight, i) => (
              <View key={i} style={styles.insightRow}>
                <View style={styles.insightDot} />
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Raw Text */}
        <TouchableOpacity
          style={styles.rawTextToggle}
          onPress={() => {}}
        >
          <Text style={styles.rawTextLabel}>Original dump</Text>
          <Text style={styles.rawTextPreview} numberOfLines={2}>
            {entry.rawText}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  gradient: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 16,
  },
  loadingText: {
    fontFamily: Fonts.body,
    color: Colors.textMuted,
    fontSize: 15,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: Spacing.lg,
    paddingTop: 56,
    paddingBottom: Spacing.md,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgCard,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    color: Colors.text,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textDim,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  sectionCount: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.accent,
  },
  summary: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    color: Colors.text,
    lineHeight: 32,
    marginTop: Spacing.md,
  },
  focusCard: {
    backgroundColor: Colors.accentSoft,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.accentGlow,
    marginBottom: Spacing.xl,
  },
  focusHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: Spacing.sm,
  },
  focusLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.accent,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
  focusTitle: {
    fontFamily: Fonts.heading,
    fontSize: 20,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  focusReason: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 21,
  },
  insightRow: {
    flexDirection: 'row' as const,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    alignItems: 'flex-start' as const,
  },
  insightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
    marginTop: 7,
    flexShrink: 0,
  },
  insightText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.textMuted,
    lineHeight: 23,
    flex: 1,
  },
  rawTextToggle: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  rawTextLabel: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.textDim,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    marginBottom: 6,
  },
  rawTextPreview: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 20,
  },
});