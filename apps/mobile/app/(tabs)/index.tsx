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
} from 'react-native';
import { useRouter } from 'expo-router';
import { processDump } from '../../services/api';
import { saveToHistory } from '../../services/storage';
import { Colors, Fonts, Spacing, Radius } from '../../services/theme';

const PROMPTS = [
  "What's swirling in your head right now?",
  "Empty your mind. What's weighing on you?",
  "Just type. No filter, no judgment.",
  "What are you carrying around today?",
  "Spill it. Every thought, every task.",
];

const CHAR_LIMIT = 3000;

export default function DumpScreen() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [promptIndex] = useState(() => Math.floor(Math.random() * PROMPTS.length));
  const inputRef = useRef<TextInput>(null);
  const router = useRouter();

  const charCount = text.length;
  const isReady = text.trim().length > 10;

  async function handleProcess() {
    if (!isReady || loading) return;
    console.log('BUTTON PRESSED, text:', text);  // ← add this
    setLoading(true);

    try {
      const response = await processDump(text);
      const entry = await saveToHistory(text, response.data);
      router.push({
        pathname: '/result',
        params: { entryId: entry.id },
      });
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
          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={text}
              onChangeText={(t) => setText(t.slice(0, CHAR_LIMIT))}
              placeholder="Start typing your thoughts, worries, tasks, ideas... anything."
              placeholderTextColor={Colors.textDim}
              multiline
              textAlignVertical="top"
              maxLength={CHAR_LIMIT}
              autoCorrect={false}
            />
            <View style={styles.inputFooter}>
              <Text style={styles.charCount}>
                {charCount > 0 ? `${charCount} / ${CHAR_LIMIT}` : ''}
              </Text>
              {charCount > 0 && (
                <TouchableOpacity onPress={() => setText('')}>
                  <Text style={styles.clearBtn}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* Quick starters */}
        {text.length === 0 && (
          <View style={styles.starters}>
            <Text style={styles.startersLabel}>Try starting with...</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {['I need to...', "I'm worried about...", "Today I have...", "I keep forgetting..."].map(
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
          disabled={!isReady || loading}
          activeOpacity={0.85}
          style={styles.btnWrapper}
        >
          <View style={[styles.btn, { backgroundColor: isReady ? Colors.accent : Colors.bgElevated }, !isReady && styles.btnDisabled]}>
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
          </View>
        </TouchableOpacity>

        {/* Reassurance */}
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
  input: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.text,
    lineHeight: 26,
    minHeight: 160,
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
  btnWrapper: {
    marginBottom: Spacing.md,
  },
  btn: {
    borderRadius: Radius.lg,
    paddingVertical: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  btnDisabled: {
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