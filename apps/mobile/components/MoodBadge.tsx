import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Radius } from '../services/theme';
import { ProcessedDump } from '../services/api';

const MOOD_CONFIG: Record<
  ProcessedDump['mood'],
  { emoji: string; label: string; color: string; bg: string }
> = {
  focused: { emoji: '🎯', label: 'Focused', color: Colors.focused, bg: Colors.focused + '20' },
  overwhelmed: { emoji: '🌊', label: 'Overwhelmed', color: Colors.overwhelmed, bg: Colors.overwhelmed + '20' },
  anxious: { emoji: '⚡️', label: 'Anxious', color: Colors.anxious, bg: Colors.anxious + '20' },
  energized: { emoji: '✨', label: 'Energized', color: Colors.energized, bg: Colors.energized + '20' },
  scattered: { emoji: '🌀', label: 'Scattered', color: Colors.scattered, bg: Colors.scattered + '20' },
  reflective: { emoji: '🌙', label: 'Reflective', color: Colors.reflective, bg: Colors.reflective + '20' },
  stressed: { emoji: '🔥', label: 'Stressed', color: Colors.stressed, bg: Colors.stressed + '20' },
  creative: { emoji: '🎨', label: 'Creative', color: Colors.creative, bg: Colors.creative + '20' },
};

interface Props {
  mood: ProcessedDump['mood'];
  large?: boolean;
}

export default function MoodBadge({ mood, large = false }: Props) {
  const config = MOOD_CONFIG[mood] || MOOD_CONFIG.focused;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg, borderColor: config.color + '40' },
        large && styles.badgeLarge,
      ]}
    >
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
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start' as const,
  },
  badgeLarge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 7,
  },
  emoji: {
    fontSize: 12,
  },
  emojiLarge: {
    fontSize: 16,
  },
  label: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '500' as const,
  },
  labelLarge: {
    fontSize: 14,
  },
});