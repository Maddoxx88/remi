import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task, ActionType } from '../services/api';
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

const ACTION_CONFIG: Record<ActionType, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  email: { label: 'Email', icon: 'mail-outline' },
  call: { label: 'Call', icon: 'call-outline' },
  meet: { label: 'Meet', icon: 'people-outline' },
  buy: { label: 'Buy', icon: 'cart-outline' },
  review: { label: 'Review', icon: 'document-text-outline' },
  submit: { label: 'Submit', icon: 'send-outline' },
  plan: { label: 'Plan', icon: 'map-outline' },
  remind: { label: 'Remind', icon: 'notifications-outline' },
  write: { label: 'Write', icon: 'pencil-outline' },
  schedule: { label: 'Schedule', icon: 'calendar-outline' },
  other: { label: 'Task', icon: 'flash-outline' },
};

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDueDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function TaskCard({ task }: { task: Task }) {
  const priority = PRIORITY_CONFIG[task.priority];
  const actionType = task.actionType ?? 'other';
  const action = ACTION_CONFIG[actionType] ?? ACTION_CONFIG.other;
  const hasMeta = !!(task.dueLabel || task.dueDate || task.project || (task.actionType && task.actionType !== 'other'));

  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.emoji}>{CATEGORY_ICONS[task.category]}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{task.title}</Text>
        {task.notes && <Text style={styles.notes}>{task.notes}</Text>}

        {hasMeta && (
          <View style={styles.metaRow}>
            {task.actionType && task.actionType !== 'other' && (
              <View style={styles.actionBadge}>
                <Ionicons name={action.icon} size={11} color={Colors.text} />
                <Text style={styles.actionText}>{action.label}</Text>
              </View>
            )}
            {task.project && (
              <View style={styles.projectBadge}>
                <Text style={styles.projectText}>{task.project}</Text>
              </View>
            )}
            {(task.dueLabel || task.dueDate) && (
              <View style={styles.dueBadge}>
                <Ionicons name="calendar-outline" size={11} color={Colors.accentDark} />
                <Text style={styles.dueText}>
                  {task.dueLabel ?? formatDueDate(task.dueDate!)}
                </Text>
              </View>
            )}
          </View>
        )}

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
  metaRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
    marginBottom: Spacing.sm,
  },
  actionBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.accentSoft,
  },
  actionText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.text,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.4,
  },
  projectBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.sage,
  },
  projectText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  dueBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.tealSoft,
  },
  dueText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.accentDark,
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
