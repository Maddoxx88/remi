import { useState, useRef, useEffect } from 'react';
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
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { processDump } from '../../services/api';
import { saveToHistory } from '../../services/storage';
import { Colors, Fonts, Spacing, Radius } from '../../services/theme';
import { useVoiceInput } from '../../hooks/useVoiceInput';

const PROMPTS = [
  "What's on your mind today?",
  "Empty your mind. What's weighing on you?",
  "Just type. No filter, no judgment.",
  "What are you carrying around today?",
  "Spill it. Every thought, every task.",
];

const CHAR_LIMIT = 3000;

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function DumpScreen() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [promptIndex] = useState(() => Math.floor(Math.random() * PROMPTS.length));
  const inputRef = useRef<TextInput>(null);
  const router = useRouter();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const { voiceState, startRecording, stopAndTranscribe, cancelRecording, recordingDuration } = useVoiceInput();

  const charCount = text.length;
  const isReady = text.trim().length > 10;
  const isRecording = voiceState === 'recording';

  useEffect(() => {
    if (voiceState !== 'recording') {
      pulseLoopRef.current?.stop();
      pulseLoopRef.current = null;
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    pulseLoopRef.current = loop;
    loop.start();

    return () => {
      loop.stop();
      pulseLoopRef.current = null;
      pulseAnim.setValue(1);
    };
  }, [voiceState, pulseAnim]);

  async function handleVoicePress() {
    if (voiceState === 'idle') {
      await startRecording();
    } else if (voiceState === 'recording') {
      const transcript = await stopAndTranscribe();
      if (transcript) {
        setText(prev => prev ? prev + ' ' + transcript : transcript);
      }
    }
  }

  async function handleProcess() {
    if (!isReady || loading) return;
    setLoading(true);
    try {
      const response = await processDump(text);
      const entry = await saveToHistory(text, response.data);
      router.push({ pathname: '/result', params: { entryId: entry.id } });
      setText('');
    } catch (err: any) {
      Alert.alert('Something went wrong', err.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
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
            <View style={styles.logoIcon}>
              <Ionicons name="flash" size={16} color={Colors.text} />
            </View>
            <Text style={styles.logoText}>remi</Text>
          </View>
        </View>

        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>Hey there,</Text>
          <Text style={styles.prompt}>{PROMPTS[promptIndex]}</Text>
        </View>

        {/* Quick action cards */}
        <View style={styles.quickCards}>
          <TouchableOpacity
            style={styles.darkCard}
            onPress={() => inputRef.current?.focus()}
          >
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={styles.darkCardText}>Start typing</Text>
          </TouchableOpacity>

          <Animated.View style={{ transform: [{ scale: pulseAnim }], flex: 1 }}>
            <TouchableOpacity
              style={[styles.accentCard, isRecording && styles.accentCardRecording]}
              onPress={handleVoicePress}
              disabled={voiceState === 'processing' || voiceState === 'requesting'}
            >
              {voiceState === 'processing' || voiceState === 'requesting' ? (
                <ActivityIndicator size="small" color={Colors.text} />
              ) : (
                <Ionicons
                  name={isRecording ? 'stop' : 'mic'}
                  size={20}
                  color={Colors.text}
                />
              )}
              <Text style={styles.accentCardText}>
                {isRecording ? `${formatDuration(recordingDuration)}` : 'Voice input'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Input Box */}
        <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()}>
          <View style={[styles.inputContainer, isRecording && styles.inputRecording]}>
            {isRecording ? (
              <View style={styles.recordingBox}>
                <View style={styles.recordingPulse} />
                <Text style={styles.recordingLabel}>Listening... {formatDuration(recordingDuration)}</Text>
                <TouchableOpacity onPress={cancelRecording} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={text}
                onChangeText={(t) => setText(t.slice(0, CHAR_LIMIT))}
                placeholder="Type your thoughts freely here — tasks, worries, ideas, anything..."
                placeholderTextColor={Colors.textDim}
                multiline
                textAlignVertical={'top' as const}
                maxLength={CHAR_LIMIT}
                autoCorrect={false}
              />
            )}

            {charCount > 0 && !isRecording && (
              <View style={styles.inputFooter}>
                <Text style={styles.charCount}>{charCount} / {CHAR_LIMIT}</Text>
                <TouchableOpacity onPress={() => setText('')}>
                  <Text style={styles.clearBtn}>Clear</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Quick starters */}
        {text.length === 0 && !isRecording && (
          <View style={styles.starters}>
            <Text style={styles.startersLabel}>Try starting with</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {["I need to...", "I'm worried about...", "Today I have...", "I keep forgetting..."].map(
                (starter) => (
                  <TouchableOpacity
                    key={starter}
                    style={styles.starterChip}
                    onPress={() => {
                      setText(starter + ' ');
                      inputRef.current?.focus();
                    }}
                  >
                    <Text style={styles.starterText}>{starter}</Text>
                  </TouchableOpacity>
                )
              )}
            </ScrollView>
          </View>
        )}

        {/* Process Button */}
        <TouchableOpacity
          onPress={handleProcess}
          disabled={!isReady || loading || isRecording}
          activeOpacity={0.85}
          style={[styles.btn, (!isReady || isRecording) && styles.btnDisabled]}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={Colors.text} size="small" />
              <Text style={styles.btnText}>Remi is thinking...</Text>
            </View>
          ) : (
            <View style={styles.loadingRow}>
              <Text style={[styles.btnText, (!isReady || isRecording) && styles.btnTextDisabled]}>
                Organize my thoughts
              </Text>
              {isReady && <Ionicons name="arrow-forward" size={18} color={Colors.text} />}
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.reassurance}>
          Processed privately · Never stored on our servers
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  logoRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.accent,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  logoText: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    color: Colors.text,
    letterSpacing: 0.5,
  },
  greetingSection: {
    marginBottom: Spacing.xl,
  },
  greeting: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  prompt: {
    fontFamily: Fonts.heading,
    fontSize: 28,
    color: Colors.text,
    lineHeight: 36,
  },
  quickCards: {
    flexDirection: 'row' as const,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  darkCard: {
    flex: 1,
    backgroundColor: Colors.darkCard,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    alignItems: 'flex-start' as const,
    justifyContent: 'space-between' as const,
    minHeight: 100,
  },
  darkCardText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.darkCardText,
    fontWeight: '500' as const,
  },
  accentCard: {
    flex: 1,
    backgroundColor: Colors.accent,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    alignItems: 'flex-start' as const,
    justifyContent: 'space-between' as const,
    minHeight: 100,
  },
  accentCardRecording: {
    backgroundColor: Colors.high,
  },
  accentCardText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  inputContainer: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    minHeight: 160,
  },
  inputRecording: {
    borderColor: Colors.high,
  },
  input: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.text,
    lineHeight: 26,
    minHeight: 120,
  },
  recordingBox: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: Spacing.md,
    minHeight: 120,
  },
  recordingPulse: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.high,
  },
  recordingLabel: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.textMuted,
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
  },
  inputFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  charCount: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.textDim,
  },
  clearBtn: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
  },
  starters: {
    marginBottom: Spacing.lg,
  },
  startersLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textDim,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  starterChip: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  starterText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
  },
  btn: {
    borderRadius: Radius.xl,
    paddingVertical: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.accent,
    marginBottom: Spacing.md,
  },
  btnDisabled: {
    backgroundColor: Colors.bgElevated,
  },
  btnText: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  btnTextDisabled: {
    color: Colors.textDim,
  },
  loadingRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  reassurance: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textDim,
    textAlign: 'center' as const,
  },
});