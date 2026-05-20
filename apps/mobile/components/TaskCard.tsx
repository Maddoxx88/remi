import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '../services/api';
import { Colors, Fonts, Spacing, Radius } from '../services/theme';

const PRIORITY_CONFIG = {
  high:   { color: '#C03030', bg: '#FFD0D0', label: 'High',   icon: 'arrow-up' as const },
  medium: { color: '#8B5E00', bg: '#FFE9B0', label: 'Medium', icon: 'remove' as const },
  low:    { color: '#1A7A5E', bg: Colors.teal, label: 'Low',  icon: 'arrow-down' as const },
};

const CATEGORY_ICONS: Record<Task['category'], string> = {
  work: '💼', personal: '🏠', health: '💚',
  finance: '💰', creative: '🎨', social: '👥', admin: '📋',
};

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function TaskCard({ task }: { task: Task }) {
  const priority = PRIORITY_CONFIG[task.priority];

  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.emoji}>{CATEGORY_ICONS[task.category]}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{task.title}</Text>
        {task.notes && <Text style={styles.notes}>{task.notes}</Text>}
        <View style={styles.meta}>
          <View style={[styles.priorityBadge, { backgroundColor: priority.bg }]}>
            <Ionicons name={priority.icon} size={10} color={priority.color} />
            <Text style={[styles.priorityText, { color: priority.color }]}>{priority.label}</Text>
          </View>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={11} color={Colors.textDim} />
            <Text style={styles.timeText}>{formatMinutes(task.estimatedMinutes)}</Text>
          </View>
          <Text style={styles.category}>{task.category}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    alignItems: 'flex-start' as const,
  },
  left: { paddingTop: 2 },
  emoji: { fontSize: 18 },
  body: { flex: 1 },
  title: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 4,
    fontWeight: '500' as const,
  },
  notes: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 19,
    marginBottom: Spacing.sm,
  },
  meta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.sm,
    flexWrap: 'wrap' as const,
  },
  priorityBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  priorityText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '600' as const,
  },
  timeRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 3,
  },
  timeText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.textDim,
  },
  category: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.textDim,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
});