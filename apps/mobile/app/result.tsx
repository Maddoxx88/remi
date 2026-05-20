import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getHistory, DumpEntry } from '../services/storage';
import { Task, ProcessedDump } from '../services/api';
import { Colors, Fonts, Spacing, Radius } from '../services/theme';
import MoodBadge from '../components/MoodBadge';
import TaskCard from '../components/TaskCard';

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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Clarity</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Mood + Summary hero card */}
        <View style={styles.heroCard}>
          <MoodBadge mood={result.mood} large />
          <Text style={styles.summary}>{result.summary}</Text>
        </View>

        {/* Focus Card */}
        <View style={styles.focusCard}>
          <View style={styles.focusHeader}>
            <View style={styles.focusIconWrap}>
              <Ionicons name="flash" size={14} color={Colors.text} />
            </View>
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
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{result.tasks.length}</Text>
              </View>
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
            <View style={styles.insightsCard}>
              {result.insights.map((insight, i) => (
                <View key={i} style={[styles.insightRow, i > 0 && styles.insightBorder]}>
                  <Text style={styles.insightText}>{insight}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Raw dump */}
        <View style={styles.rawCard}>
          <Text style={styles.rawLabel}>Original dump</Text>
          <Text style={styles.rawText} numberOfLines={3}>{entry.rawText}</Text>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loadingContainer: {
    flex: 1, backgroundColor: Colors.bg,
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  loadingText: { fontFamily: Fonts.body, color: Colors.textMuted, fontSize: 15 },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: Spacing.lg,
    paddingTop: 56,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.bg,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  headerTitle: { fontFamily: Fonts.heading, fontSize: 18, color: Colors.text },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },

  heroCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  summary: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    color: Colors.text,
    lineHeight: 32,
  },

  focusCard: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  focusHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 4,
  },
  focusIconWrap: {
    width: 24, height: 24, borderRadius: 8,
    backgroundColor: Colors.text + '15',
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  focusLabel: {
    fontFamily: Fonts.body, fontSize: 12,
    color: Colors.text, letterSpacing: 1,
    textTransform: 'uppercase' as const, fontWeight: '600' as const,
  },
  focusTitle: {
    fontFamily: Fonts.heading, fontSize: 22, color: Colors.text,
  },
  focusReason: {
    fontFamily: Fonts.body, fontSize: 14,
    color: Colors.text + 'CC', lineHeight: 21,
  },

  section: { marginBottom: Spacing.xl },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Fonts.body, fontSize: 13,
    color: Colors.textMuted, letterSpacing: 0.5,
    textTransform: 'uppercase' as const, fontWeight: '600' as const,
  },
  countBadge: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  countText: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.textMuted },

  insightsCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden' as const,
  },
  insightRow: { padding: Spacing.lg },
  insightBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  insightText: {
    fontFamily: Fonts.body, fontSize: 15,
    color: Colors.textMuted, lineHeight: 23,
  },

  rawCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  rawLabel: {
    fontFamily: Fonts.mono, fontSize: 11,
    color: Colors.textDim, letterSpacing: 1,
    textTransform: 'uppercase' as const, marginBottom: 6,
  },
  rawText: {
    fontFamily: Fonts.body, fontSize: 13,
    color: Colors.textMuted, lineHeight: 20,
  },
});