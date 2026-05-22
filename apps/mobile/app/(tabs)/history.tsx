import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getHistory, deleteEntry, clearHistory, DumpEntry } from '../../services/storage';
import { Colors, Fonts, Spacing, Radius } from '../../services/theme';
import MoodBadge from '../../components/MoodBadge';
import TabEmptyState from '../../components/TabEmptyState';

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
  const diffD = diffH / 24;
  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${Math.floor(diffH)}h ago`;
  if (diffD < 7) return `${Math.floor(diffD)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function HistoryCard({ entry, onPress, onDelete }: { entry: DumpEntry; onPress: () => void; onDelete: () => void }) {
  const taskCount = entry.result.tasks.length;
  const highCount = entry.result.tasks.filter(t => t.priority === 'high').length;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <MoodBadge mood={entry.result.mood} />
        <View style={styles.cardHeaderRight}>
          <Text style={styles.cardDate}>{formatDate(entry.createdAt)}</Text>
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={15} color={Colors.textDim} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.focusTitle} numberOfLines={1}>
        {entry.result.focusItem.title}
      </Text>
      <Text style={styles.cardSummary} numberOfLines={2}>
        {entry.result.summary}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.cardStat}>
          <Ionicons name="checkmark-circle-outline" size={12} color={Colors.textDim} />
          <Text style={styles.cardStatText}>{taskCount} task{taskCount !== 1 ? 's' : ''}</Text>
        </View>
        {highCount > 0 && (
          <View style={styles.cardStat}>
            <Ionicons name="alert-circle" size={12} color={Colors.high} />
            <Text style={[styles.cardStatText, { color: Colors.high }]}>{highCount} urgent</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const [entries, setEntries] = useState<DumpEntry[]>([]);
  const router = useRouter();

  useFocusEffect(useCallback(() => { loadHistory(); }, []));

  async function loadHistory() {
    setEntries(await getHistory());
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete this entry?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteEntry(id); loadHistory(); } },
    ]);
  }

  function handleClearAll() {
    Alert.alert('Clear all history?', 'All your saved dumps will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: async () => { await clearHistory(); loadHistory(); } },
    ]);
  }

  if (entries.length === 0) {
    return <TabEmptyState variant="history" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>{entries.length} dump{entries.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn}>
          <Text style={styles.clearBtnText}>Clear all</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={entries}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <HistoryCard
            entry={item}
            onPress={() => router.push({ pathname: '/result', params: { entryId: item.id } })}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-end' as const,
    paddingHorizontal: Spacing.lg,
    paddingTop: 64,
    paddingBottom: Spacing.lg,
  },
  title: { fontFamily: Fonts.heading, fontSize: 32, color: Colors.text },
  subtitle: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  clearBtn: {
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  clearBtnText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textMuted },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing.sm,
  },
  cardHeaderRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  cardDate: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.textDim },
  focusTitle: {
    fontFamily: Fonts.heading, fontSize: 17,
    color: Colors.text, marginBottom: 4,
  },
  cardSummary: {
    fontFamily: Fonts.body, fontSize: 14,
    color: Colors.textMuted, lineHeight: 21, marginBottom: Spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.md,
  },
  cardStat: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  cardStatText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textMuted },
});