import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import TabEmptyIllustration from './TabEmptyIllustration';
import { Colors, Fonts, Spacing, Radius } from '../services/theme';

const COPY = {
  history: {
    title: 'No history yet',
    subtitle:
      'Every brain dump you organize lands here — moods, tasks, and summaries ready to revisit.',
    cta: 'Start your first dump',
    icon: 'sparkles' as const,
  },
  insights: {
    title: 'Your patterns live here',
    subtitle:
      'After a few dumps, Remi charts your mood, task mix, and weekly habits — like which days hit hardest.',
    cta: 'Go to dump screen',
    icon: 'chatbubble-ellipses-outline' as const,
  },
};

interface Props {
  variant: 'history' | 'insights';
}

export default function TabEmptyState({ variant }: Props) {
  const router = useRouter();
  const content = COPY[variant];

  function goToDump() {
    router.navigate('/(tabs)/');
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.inner}>
        <View style={styles.illustrationWrap}>
          <TabEmptyIllustration variant={variant} />
        </View>
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.subtitle}>{content.subtitle}</Text>
        <TouchableOpacity style={styles.cta} onPress={goToDump} activeOpacity={0.88}>
          <Ionicons name={content.icon} size={18} color={Colors.text} />
          <Text style={styles.ctaText}>{content.cta}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  illustrationWrap: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 26,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: Spacing.xl,
    maxWidth: 300,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderRadius: Radius.full,
  },
  ctaText: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: Colors.text,
  },
});
