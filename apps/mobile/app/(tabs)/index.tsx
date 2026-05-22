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
  Dimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { processDump } from '../../services/api';
import { API_BASE_URL } from '../../services/config';
import { saveToHistory, getHistory, DumpEntry } from '../../services/storage';
import { buildPreviousContext } from '../../services/dumpContext';
import { consumePendingTranscript } from '../../services/voiceSession';
import RemiLogo from '../../components/RemiLogo';
import ProcessErrorCard from '../../components/ProcessErrorCard';
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

type InputMode = null | 'chat';

function ModeButton({
  label,
  icon,
  backgroundColor,
  onPress,
  flex = 1,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  backgroundColor: string;
  onPress: () => void;
  flex?: number;
}) {
  return (
    <TouchableOpacity
      style={[styles.modeBtn, { backgroundColor, flex }]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <Ionicons name={icon} size={28} color={Colors.darkCardText} />
      <Text style={styles.modeBtnLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function DumpScreen() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState<DumpEntry[]>([]);
  const [processError, setProcessError] = useState<string | null>(null);
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
        setInputMode('chat');
      }
    }, []),
  );

  function openChat() {
    setInputMode('chat');
    setTimeout(() => inputRef.current?.focus(), 150);
  }

  function closeChat() {
    setInputMode(null);
    setProcessError(null);
    inputRef.current?.blur();
  }

  function openVoice() {
    router.push('/voice');
  }

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
    setProcessError(null);
    setLoading(true);
    try {
      const previousContext = buildPreviousContext(history, 3);
      const response = await processDump(text, previousContext);
      const entry = await saveToHistory(text, response.data);
      setHistory(await getHistory());
      router.push({ pathname: '/result', params: { entryId: entry.id } });
      setText('');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Please try again.';
      if (__DEV__) console.warn('[process]', API_BASE_URL, message);
      setProcessError(message);
    } finally {
      setLoading(false);
    }
  }

  function applyStarter(key: string) {
    const starter = STARTERS[key];
    if (starter) {
      setText(starter);
      setInputMode('chat');
      setTimeout(() => inputRef.current?.focus(), 150);
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
            <View style={styles.logoRow}>
              <RemiLogo size={40} />
              <Text style={styles.logoWordmark}>remi</Text>
            </View>
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

          {/* Mode picker — voice (left) + chat (right) */}
          {inputMode === null && (
            <View style={styles.modeGrid}>
              <ModeButton
                label="Talk"
                icon="mic-outline"
                backgroundColor={Colors.nameAccent}
                onPress={openVoice}
                flex={1.15}
              />
              <ModeButton
                label="Chat"
                icon="chatbubble-outline"
                backgroundColor={Colors.darkCard}
                onPress={openChat}
              />
            </View>
          )}

          {/* Chat panel — shown after tapping Chat */}
          {inputMode === 'chat' && (
            <View style={styles.chatPanel}>
              <TouchableOpacity style={styles.chatBack} onPress={closeChat} hitSlop={12}>
                <Ionicons name="chevron-back" size={20} color={Colors.textMuted} />
                <Text style={styles.chatBackText}>Back</Text>
              </TouchableOpacity>

              <View style={styles.chatBox}>
                <TextInput
                  ref={inputRef}
                  style={styles.chatInput}
                  value={text}
                  onChangeText={t => {
                    setText(t.slice(0, CHAR_LIMIT));
                    if (processError) setProcessError(null);
                  }}
                  placeholder="Dump your thoughts — tasks, worries, ideas, anything..."
                  placeholderTextColor={Colors.textDim}
                  multiline
                  textAlignVertical="top"
                  maxLength={CHAR_LIMIT}
                />
              </View>

              <View style={styles.chatFooter}>
                <Text style={styles.charHint}>
                  {charCount > 0 ? `${charCount} / ${CHAR_LIMIT}` : 'Min 11 characters to organize'}
                </Text>
                <TouchableOpacity
                  style={[styles.organizeBtn, (!isReady || loading) && styles.organizeBtnDisabled]}
                  onPress={handleProcess}
                  disabled={!isReady || loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={Colors.text} />
                  ) : (
                    <>
                      <Text style={[styles.organizeBtnText, !isReady && styles.organizeBtnTextDisabled]}>
                        Organize
                      </Text>
                      <Ionicons
                        name="sparkles"
                        size={16}
                        color={isReady ? Colors.text : Colors.textDim}
                      />
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {processError ? (
                <ProcessErrorCard
                  message={processError}
                  onDismiss={() => setProcessError(null)}
                />
              ) : null}
            </View>
          )}

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
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoWordmark: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: Colors.text,
    letterSpacing: -0.5,
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
    fontFamily: Fonts.bold,
    fontSize: 32,
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: -0.8,
  },
  greetingName: {
    color: Colors.nameAccent,
  },
  prompt: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: Colors.textMuted,
    lineHeight: 24,
  },
  modeGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.xxl,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  modeBtnLabel: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: Colors.darkCardText,
    textAlign: 'center',
  },
  chatPanel: {
    marginBottom: Spacing.lg,
  },
  chatBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  chatBackText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.textMuted,
  },
  chatBox: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    minHeight: 160,
    marginBottom: Spacing.sm,
  },
  chatInput: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: Colors.text,
    lineHeight: 26,
    minHeight: 120,
  },
  chatFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  charHint: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Colors.textDim,
    flex: 1,
  },
  organizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderRadius: Radius.full,
  },
  organizeBtnDisabled: {
    backgroundColor: Colors.bgElevated,
  },
  organizeBtnText: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.text,
  },
  organizeBtnTextDisabled: {
    color: Colors.textDim,
  },
  sectionTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
    color: Colors.text,
    marginBottom: Spacing.md,
    letterSpacing: -0.3,
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
    fontFamily: Fonts.medium,
    fontSize: 14,
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
    fontFamily: Fonts.regular,
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
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.textDim,
    marginBottom: Spacing.md,
  },
  recentEmpty: {
    fontFamily: Fonts.regular,
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
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  reassurance: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textDim,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
