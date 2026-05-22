import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Fonts, Spacing, Radius } from '../services/theme';
import RemiLogo from '../components/RemiLogo';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    key: 'dump',
    emoji: '🧠',
    title: 'Empty your mind',
    subtitle: 'Type or speak every thought, worry, task, and idea — raw and unfiltered. No structure needed.',
    accent: Colors.accent,
    bullets: ['Type freely or use voice', 'No formatting required', 'As short or long as you need'],
  },
  {
    key: 'clarity',
    emoji: '✨',
    title: 'Get instant clarity',
    subtitle: 'Remi reads your dump and transforms it into structured, actionable output in seconds.',
    accent: Colors.focused,
    bullets: ['Mood detection', 'Prioritized task list', 'Your #1 focus item'],
  },
  {
    key: 'history',
    emoji: '📖',
    title: 'Track your patterns',
    subtitle: 'Every dump is saved. Review your history to spot trends in your mood and workload over time.',
    accent: Colors.creative,
    bullets: ['Full history saved locally', 'Re-view any past dump', 'Spot recurring patterns'],
  },
];

const ONBOARDING_KEY = 'remi_onboarding_complete';

export async function markOnboardingComplete() {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  const val = await AsyncStorage.getItem(ONBOARDING_KEY);
  return val === 'true';
}

export default function OnboardingScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const router = useRouter();

  function goToSlide(index: number) {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0.3, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    scrollRef.current?.scrollTo({ x: index * width, animated: true });
    setActiveIndex(index);
  }

  async function handleGetStarted() {
    await markOnboardingComplete();
    router.replace('/(tabs)');
  }

  const isLast = activeIndex === SLIDES.length - 1;
  const slide = SLIDES[activeIndex];

  return (
    <View style={styles.container}>
      {/* Skip button */}
      {!isLast && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleGetStarted}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={styles.slideScroll}
      >
        {SLIDES.map((s, i) => (
          <Animated.View
            key={s.key}
            style={[
              styles.slide,
              { opacity: i === activeIndex ? fadeAnim : 1 },
            ]}
          >
            {s.key === 'dump' ? (
              <View style={styles.logoBlob}>
                <RemiLogo size={96} />
              </View>
            ) : (
              <View style={[styles.emojiBlob, { backgroundColor: s.accent + '15' }]}>
                <Text style={styles.emoji}>{s.emoji}</Text>
              </View>
            )}

            <Text style={styles.slideTitle}>{s.title}</Text>
            <Text style={styles.slideSubtitle}>{s.subtitle}</Text>

            {/* Bullets */}
            <View style={styles.bullets}>
              {s.bullets.map((b, bi) => (
                <View key={bi} style={styles.bulletRow}>
                  <View style={[styles.bulletDot, { backgroundColor: s.accent }]} />
                  <Text style={styles.bulletText}>{b}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      {/* Bottom controls */}
      <View style={styles.bottom}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goToSlide(i)}>
              <View
                style={[
                  styles.dot,
                  i === activeIndex && styles.dotActive,
                  i === activeIndex && { backgroundColor: slide.accent },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Next / Get Started button */}
        {isLast ? (
          <TouchableOpacity style={[styles.btn, { backgroundColor: slide.accent }]} onPress={handleGetStarted}>
            <Text style={styles.btnText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: slide.accent }]}
            onPress={() => goToSlide(activeIndex + 1)}
          >
            <Text style={styles.btnText}>Next</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Branding */}
      <View style={styles.branding}>
        <View style={styles.brandDot} />
        <Text style={styles.brandText}>remi</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  skipBtn: {
    position: 'absolute' as const,
    top: 56,
    right: Spacing.lg,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skipText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
  },
  slideScroll: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: Spacing.xl,
    paddingTop: 80,
  },
  logoBlob: {
    width: 120,
    height: 120,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: Spacing.xl,
  },
  emojiBlob: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: Spacing.xl,
  },
  emoji: {
    fontSize: 56,
  },
  slideTitle: {
    fontFamily: Fonts.heading,
    fontSize: 32,
    color: Colors.text,
    textAlign: 'center' as const,
    marginBottom: Spacing.md,
    lineHeight: 42,
  },
  slideSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center' as const,
    lineHeight: 26,
    marginBottom: Spacing.xl,
  },
  bullets: {
    alignSelf: 'stretch' as const,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  bulletRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.md,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  bulletText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  bottom: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 48,
    paddingTop: Spacing.lg,
    gap: Spacing.lg,
    alignItems: 'center' as const,
  },
  dots: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 24,
  },
  btn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    width: '100%',
    paddingVertical: 18,
    borderRadius: Radius.lg,
  },
  btnText: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600' as const,
  },
  branding: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingBottom: 16,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  brandText: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    color: Colors.textDim,
    letterSpacing: 1,
  },
});