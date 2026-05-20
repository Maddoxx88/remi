import { useState, useRef } from 'react';
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
  "What's swirling in your head right now?",
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

  const { voiceState, startRecording, stopAndTranscribe, cancelRecording, recordingDuration } = useVoiceInput();

  const charCount = text.length;
  const isReady = text.trim().length > 10;
  const isRecording = voiceState === 'recording';

  // Pulse animation for recording button
  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  };

  async function handleVoicePress() {
    if (voiceState === 'idle') {
      await startRecording();
      startPulse();
    } else if (voiceState === 'recording') {
      stopPulse();
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

  const getMicIcon = () => {
    if (voiceState === 'recording') return 'stop';
    if (voiceState === 'processing') return 'hourglass';
    if (voiceState === 'requesting') return 'hourglass';
    return 'mic';
  };

  const getMicColor = () => {
    if (voiceState === 'recording') return Colors.high;
    if (voiceState === 'error') return Colors.high;
    return Colors.accent;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoDot} />
            <Text style={styles.logoText}>remi</Text>
          </View>
          <Text style={styles.tagline}>AI Thought Partner</Text>
        </View>

        {/* Prompt */}
        <Text style={styles.prompt}>{PROMPTS[promptIndex]}</Text>

        {/* Input Box */}
        <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()}>
          <View style={[styles.inputContainer, isRecording && styles.inputRecording]}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={text}
              onChangeText={(t) => setText(t.slice(0, CHAR_LIMIT))}
              placeholder="Start typing your thoughts, worries, tasks, ideas... or tap the mic."
              placeholderTextColor={Colors.textDim}
              multiline
              textAlignVertical={'top' as const}
              maxLength={CHAR_LIMIT}
              autoCorrect={false}
              editable={!isRecording}
            />

            {/* Recording indicator inside box */}
            {isRecording && (
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>
                  Recording... {formatDuration(recordingDuration)}
                </Text>
                <TouchableOpacity onPress={cancelRecording}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputFooter}>
              <Text style={styles.charCount}>
                {charCount > 0 && !isRecording ? `${charCount} / ${CHAR_LIMIT}` : ''}
              </Text>
              <View style={styles.inputActions}>
                {charCount > 0 && !isRecording && (
                  <TouchableOpacity onPress={() => setText('')}>
                    <Text style={styles.clearBtn}>Clear</Text>
                  </TouchableOpacity>
                )}

                {/* Mic Button */}
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <TouchableOpacity
                    style={[styles.micBtn, isRecording && styles.micBtnRecording]}
                    onPress={handleVoicePress}
                    disabled={voiceState === 'processing' || voiceState === 'requesting'}
                  >
                    {voiceState === 'processing' || voiceState === 'requesting' ? (
                      <ActivityIndicator size="small" color={Colors.accent} />
                    ) : (
                      <Ionicons name={getMicIcon() as any} size={18} color={getMicColor()} />
                    )}
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Quick starters */}
        {text.length === 0 && !isRecording && (
          <View style={styles.starters}>
            <Text style={styles.startersLabel}>Try starting with...</Text>
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
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.btnText}>Remi is thinking...</Text>
            </View>
          ) : (
            <Text style={[styles.btnText, !isReady && styles.btnTextDisabled]}>
              Organize my thoughts →
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.reassurance}>
          Your thoughts are processed privately and never stored on our servers.
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
    paddingTop: 64,
    paddingBottom: 40,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  logoRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 4,
  },
  logoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  logoText: {
    fontFamily: Fonts.heading,
    fontSize: 28,
    color: Colors.text,
    letterSpacing: 1,
  },
  tagline: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    marginLeft: 16,
  },
  prompt: {
    fontFamily: Fonts.heading,
    fontSize: 26,
    color: Colors.text,
    lineHeight: 36,
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    minHeight: 200,
  },
  inputRecording: {
    borderColor: Colors.high,
    borderWidth: 1.5,
  },
  input: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.text,
    lineHeight: 26,
    minHeight: 140,
  },
  recordingIndicator: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.sm,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.high,
  },
  recordingText: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.high,
    flex: 1,
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
  inputActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.sm,
  },
  clearBtn: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
  },
  micBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
  },
  micBtnRecording: {
    backgroundColor: Colors.highSoft,
    borderColor: Colors.high,
  },
  starters: {
    marginBottom: Spacing.lg,
  },
  startersLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textDim,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    marginBottom: Spacing.sm,
  },
  starterChip: {
    backgroundColor: Colors.bgElevated,
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
    borderRadius: Radius.lg,
    paddingVertical: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.accent,
    marginBottom: Spacing.md,
  },
  btnDisabled: {
    backgroundColor: Colors.bgElevated,
    opacity: 0.5,
  },
  btnText: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600' as const,
    letterSpacing: 0.3,
  },
  btnTextDisabled: {
    color: Colors.textDim,
  },
  loadingRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  reassurance: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textDim,
    textAlign: 'center' as const,
    lineHeight: 18,
  },
});