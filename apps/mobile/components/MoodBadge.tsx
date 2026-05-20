import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Radius } from '../services/theme';
import { ProcessedDump } from '../services/api';

const MOOD_CONFIG: Record<ProcessedDump['mood'], { emoji: string; label: string; color: string; bg: string }> = {
  focused:    { emoji: '🎯', label: 'Focused',     color: '#1A7A5E', bg: Colors.teal },
  overwhelmed:{ emoji: '🌊', label: 'Overwhelmed', color: '#C04000', bg: '#FFD4B8' },
  anxious:    { emoji: '⚡️', label: 'Anxious',     color: '#8B5E00', bg: '#FFE9B0' },
  energized:  { emoji: '✨', label: 'Energized',   color: '#5A7A00', bg: Colors.accent },
  scattered:  { emoji: '🌀', label: 'Scattered',   color: '#8B6000', bg: '#FFF3B0' },
  reflective: { emoji: '🌙', label: 'Reflective',  color: '#2E4A8B', bg: '#C8D8FF' },
  stressed:   { emoji: '🔥', label: 'Stressed',    color: '#C03030', bg: '#FFD0D0' },
  creative:   { emoji: '🎨', label: 'Creative',    color: '#6B3DAA', bg: '#EDD8FF' },
};

interface Props {
  mood: ProcessedDump['mood'];
  large?: boolean;
}

export default function MoodBadge({ mood, large = false }: Props) {
  const config = MOOD_CONFIG[mood] || MOOD_CONFIG.focused;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, large && styles.badgeLarge]}>
      <Text style={large ? styles.emojiLarge : styles.emoji}>{config.emoji}</Text>
      <Text style={[styles.label, { color: config.color }, large && styles.labelLarge]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    alignSelf: 'flex-start' as const,
  },
  badgeLarge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 7,
  },
  emoji: { fontSize: 12 },
  emojiLarge: { fontSize: 18 },
  label: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  labelLarge: { fontSize: 15 },
});