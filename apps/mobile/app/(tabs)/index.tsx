import { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { processDump } from '../../services/api';
import { saveToHistory, getHistory, DumpEntry } from '../../services/storage';
import { consumePendingTranscript } from '../../services/voiceSession';
import { Colors, Fonts, Spacing, Radius } from '../../services/theme';

const PROMPTS = [
  "What's on your mind today?",
  "Empty your mind. What's weighing on you?",
  "Just type. No filter, no judgment.",
  "What are you carrying around today?",
  "Spill it. Every thought, every task.",
];

const DISCOVER = [
  { id: 'head', label: 'Clear my head', icon: 'leaf-outline' as const, color: Colors.sage },
  { id: 'today', label: 'Plan today', icon: 'calendar-outline' as const, color: Colors.sage },
  { id: 'tasks', label: 'Sort tasks', icon: 'checkbox-outline' as const, color: Colors.sage },
  { id: 'worry', label: 'Ease worries', icon: 'heart-outline' as const, color: Colors.sage },
];

const STARTERS: Record<string, string> = {
  head: "What's been on my mind lately is ",
  today: 'Today I need to ',
  tasks: 'Tasks I need to handle: ',
  worry: "I'm worried about ",
};

const CHAR_LIMIT = 3000;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const RECENT_ICON_COLORS = [Colors.sage, Colors.teal, '#E8EDC8', Colors.tealSoft];
const RECENT_ICONS = [
  'bulb-outline',
  'restaurant-outline',
  'sparkles-outline',
  'document-text-outline',
] as const;

function LogoMark() {
  return (
    <View style={styles.logoMark}>
      <View style={[styles.stripe, { transform: [{ rotate: '-35deg' }] }]} />
      <View style={[styles.stripe, { transform: [{ rotate: '-35deg' }], left: 10 }]} />
      <View style={[styles.stripe, { transform: [{ rotate: '-35deg' }], left: 20 }]} />
    </View>
  );
}

function HeroIllustration() {
  return (
    <View style={styles.heroArt}>
      <View style={styles.heroCircle} />
      <View style={styles.heroFigure}>
        <View style={styles.heroHead} />
        <View style={styles.heroBody} />
        <View style={styles.heroBox}>
          <Ionicons name="flash" size={14} color={Colors.heroBlue} />
        </View>
      </View>
    </View>
  );
}

export default function DumpScreen() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState<DumpEntry[]>([]);
  const [discoverIndex, setDiscoverIndex] = useState(0);
  const [promptIndex] = useState(() => Math.floor(Math.random() * PROMPTS.length));
  const inputRef = useRef<TextInput>(null);
  const router = useRouter();

  const charCount = text.length;
  const isReady = text.trim().length > 10;

  useFocusEffect(
    useCallback(() => {
      getHistory().then(setHistory);
      const transcript = consumePendingTranscript();
      if (transcript) {
        setText(prev => (prev ? `${prev} ${transcript}` : transcript));
      }
    }, []),
  );

  const filteredRecent = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const items = history.slice(0, 8);
    if (!q) return items.slice(0, 4);
    return items
      .filter(
        e =>
          e.rawText.toLowerCase().includes(q) ||
          e.result.summary.toLowerCase().includes(q) ||
          e.result.focusItem.title.toLowerCase().includes(q),
      )
      .slice(0, 4);
  }, [history, searchQuery]);

  async function handleProcess() {
    if (!isReady || loading) return;
    setLoading(true);
    try {
      const response = await processDump(text);
      const entry = await saveToHistory(text, response.data);
      setHistory(await getHistory());
      router.push({ pathname: '/result', params: { entryId: entry.id } });
      setText('');
    } catch (err: any) {
      Alert.alert('Something went wrong', err.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function applyStarter(key: string) {
    const starter = STARTERS[key];
    if (starter) {
      setText(starter);
      inputRef.current?.focus();
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <LogoMark />
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => router.push('/(tabs)/history')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="menu" size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Greeting */}
          <View style={styles.greetingSection}>
            <Text style={styles.greeting}>
              Hey <Text style={styles.greetingName}>there,</Text>
            </Text>
            <Text style={styles.prompt}>{PROMPTS[promptIndex]}</Text>
          </View>

          {/* Main feature grid */}
          <View style={styles.featureGrid}>
            {/* Left: hero dump card */}
            <View style={styles.heroColumn}>
              <View style={styles.heroCard}>
                <View style={styles.heroGradientTop} />
                <View style={styles.heroGradientBottom} />
                <HeroIllustration />

                <View style={styles.heroInputRow}>
                  <TextInput
                    ref={inputRef}
                    style={styles.heroInput}
                    value={text}
                    onChangeText={t => setText(t.slice(0, CHAR_LIMIT))}
                    placeholder="Dump your thoughts..."
                    placeholderTextColor={Colors.textDim}
                    multiline
                    maxLength={CHAR_LIMIT}
                  />
                  <TouchableOpacity
                    style={[styles.heroSubmit, (!isReady || loading) && styles.heroSubmitDisabled]}
                    onPress={handleProcess}
                    disabled={!isReady || loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="sparkles" size={18} color="#fff" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
              {charCount > 0 && (
                <Text style={styles.charHint}>
                  {charCount} / {CHAR_LIMIT}
                </Text>
              )}
            </View>

            {/* Right: action cards */}
            <View style={styles.sideColumn}>
              <TouchableOpacity
                style={styles.darkCard}
                onPress={() => inputRef.current?.focus()}
                activeOpacity={0.9}
              >
                <View style={styles.cardIconBadge}>
                  <Ionicons name="create-outline" size={16} color={Colors.text} />
                </View>
                <Text style={styles.darkCardText}>Start typing</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sageCard, { flex: 1 }]}
                onPress={() => router.push('/voice')}
                activeOpacity={0.9}
              >
                <Ionicons name="mic-outline" size={22} color={Colors.textMuted} />
                <Text style={styles.sageCardText}>Voice input</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Discover */}
          <Text style={styles.sectionTitle}>Discover</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.discoverScroll}
            snapToInterval={SCREEN_WIDTH * 0.38 + Spacing.sm}
            decelerationRate="fast"
            onScroll={e => {
              const cardWidth = SCREEN_WIDTH * 0.38 + Spacing.sm;
              const idx = Math.round(e.nativeEvent.contentOffset.x / cardWidth);
              setDiscoverIndex(Math.min(idx, DISCOVER.length - 1));
            }}
            scrollEventThrottle={16}
          >
            {DISCOVER.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[styles.discoverCard, { backgroundColor: item.color }]}
                onPress={() => applyStarter(item.id)}
                activeOpacity={0.85}
              >
                <Ionicons name={item.icon} size={22} color={Colors.textMuted} />
                <Text style={styles.discoverLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.dots}>
            {DISCOVER.map((_, i) => (
              <View key={i} style={[styles.dot, i === discoverIndex && styles.dotActive]} />
            ))}
          </View>

          {/* Search */}
          <View style={styles.searchRow}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={Colors.textDim} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Find past dumps"
                placeholderTextColor={Colors.textDim}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={Colors.textDim} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={styles.filterBtn}
              onPress={() => router.push('/(tabs)/history')}
            >
              <Ionicons name="options-outline" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Recent queries */}
          <Text style={styles.recentTitle}>Recent queries</Text>
          {filteredRecent.length === 0 ? (
            <Text style={styles.recentEmpty}>
              {history.length === 0
                ? 'Your organized dumps will show up here.'
                : 'No dumps match your search.'}
            </Text>
          ) : (
            filteredRecent.map((entry, i) => (
              <TouchableOpacity
                key={entry.id}
                style={styles.recentRow}
                onPress={() => router.push({ pathname: '/result', params: { entryId: entry.id } })}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.recentIcon,
                    { backgroundColor: RECENT_ICON_COLORS[i % RECENT_ICON_COLORS.length] },
                  ]}
                >
                  <Ionicons
                    name={RECENT_ICONS[i % RECENT_ICONS.length] as keyof typeof Ionicons.glyphMap}
                    size={18}
                    color={Colors.textMuted}
                  />
                </View>
                <Text style={styles.recentText} numberOfLines={2}>
                  {entry.rawText.trim() || entry.result.summary}
                </Text>
              </TouchableOpacity>
            ))
          )}

          <Text style={styles.reassurance}>
            Processed privately · Never stored on our servers
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const CARD_GAP = Spacing.sm;
const GRID_HEIGHT = 220;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    marginTop: Spacing.sm,
  },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    overflow: 'hidden',
    position: 'relative',
  },
  stripe: {
    position: 'absolute',
    width: 4,
    height: 56,
    backgroundColor: Colors.text,
    top: -8,
    left: 6,
    borderRadius: 2,
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  greetingSection: {
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontFamily: Fonts.heading,
    fontSize: 32,
    color: Colors.text,
    marginBottom: 4,
  },
  greetingName: {
    color: Colors.nameAccent,
  },
  prompt: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.textMuted,
    lineHeight: 22,
  },
  featureGrid: {
    flexDirection: 'row',
    gap: CARD_GAP,
    height: GRID_HEIGHT,
    marginBottom: Spacing.lg,
  },
  heroColumn: {
    flex: 1.15,
  },
  sideColumn: {
    flex: 1,
    gap: CARD_GAP,
  },
  heroCard: {
    flex: 1,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.heroBlueLight,
    justifyContent: 'space-between',
  },
  heroGradientTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.heroBlue,
    height: '55%',
  },
  heroGradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: Colors.heroBlueLight,
  },
  heroArt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.md,
  },
  heroCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.25)',
    top: 20,
  },
  heroFigure: {
    alignItems: 'center',
    marginTop: 8,
  },
  heroHead: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5D0B0',
    marginBottom: 4,
  },
  heroBody: {
    width: 48,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  heroBox: {
    position: 'absolute',
    right: -28,
    bottom: 8,
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.heroBlue,
  },
  heroInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    margin: Spacing.sm,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    paddingLeft: Spacing.md,
    paddingVertical: 6,
    paddingRight: 6,
    gap: Spacing.xs,
    minHeight: 48,
  },
  heroInput: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text,
    maxHeight: 72,
    paddingVertical: 8,
  },
  heroSubmit: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.darkCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSubmitDisabled: {
    backgroundColor: Colors.border,
  },
  charHint: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.textDim,
    marginTop: 4,
    marginLeft: 4,
  },
  darkCard: {
    flex: 1,
    backgroundColor: Colors.darkCard,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  cardIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkCardText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.darkCardText,
    fontWeight: '600',
  },
  sageCard: {
    flex: 1,
    backgroundColor: Colors.sage,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  sageCardText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  sectionTitle: {
    fontFamily: Fonts.body,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  discoverScroll: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  discoverCard: {
    width: SCREEN_WIDTH * 0.38,
    height: 100,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  discoverLabel: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.text,
    width: 16,
  },
  searchRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
    padding: 0,
  },
  filterBtn: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentTitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textDim,
    marginBottom: Spacing.md,
  },
  recentEmpty: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textDim,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  recentIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  reassurance: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textDim,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
