import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing } from '../services/theme';
import type { VoiceState } from '../hooks/useVoiceInput';

interface VoiceInputScreenProps {
  voiceState: VoiceState;
  transcript: string | null;
  onBack: () => void;
  onKeyboard: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

function ListeningOrb({ active }: { active: boolean }) {
  const breathe = useRef(new Animated.Value(1)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!active) {
      loopRef.current?.stop();
      loopRef.current = null;
      breathe.stopAnimation();
      breathe.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ]),
    );
    loopRef.current = loop;
    loop.start();

    return () => {
      loop.stop();
      loopRef.current = null;
      breathe.setValue(1);
    };
  }, [active, breathe]);

  return (
    <Animated.View style={[styles.orbWrap, { transform: [{ scale: breathe }] }]}>
      <View style={[styles.orbLayer, styles.orbGlow]} />
      <View style={[styles.orbLayer, styles.orbGreen]} />
      <View style={[styles.orbLayer, styles.orbYellow]} />
      <View style={[styles.orbLayer, styles.orbTeal]} />
    </Animated.View>
  );
}

function TranscriptDisplay({ text, processing }: { text: string | null; processing: boolean }) {
  if (processing) {
    return (
      <View style={styles.transcriptWrap}>
        <ActivityIndicator size="small" color={Colors.textDim} style={{ marginBottom: Spacing.sm }} />
        <Text style={styles.transcriptPlaceholder}>Transcribing your words...</Text>
      </View>
    );
  }

  if (!text) {
    return (
      <View style={styles.transcriptWrap}>
        <Text style={styles.transcriptPlaceholder}>
          Speak freely — your words will appear here.
        </Text>
      </View>
    );
  }

  const splitAt = Math.max(1, Math.floor(text.length * 0.72));
  const solid = text.slice(0, splitAt);
  const tail = text.slice(splitAt);

  return (
    <View style={styles.transcriptWrap}>
      <Text style={styles.transcript}>
        <Text style={styles.transcriptSolid}>{solid}</Text>
        {tail.length > 0 && <Text style={styles.transcriptTail}>{tail}</Text>}
      </Text>
    </View>
  );
}

export default function VoiceInputScreen({
  voiceState,
  transcript,
  onBack,
  onKeyboard,
  onCancel,
  onConfirm,
}: VoiceInputScreenProps) {
  const isRecording = voiceState === 'recording';
  const isRequesting = voiceState === 'requesting';
  const isProcessing = voiceState === 'processing';
  const isListening = isRecording || isRequesting;
  const confirmDisabled = isRequesting || isProcessing;
  const showCheckEnabled = isRecording || !!transcript;

  const statusLabel = isProcessing
    ? 'Transcribing...'
    : isRequesting
      ? 'Getting ready...'
      : isRecording
        ? "I'm listening..."
        : transcript
          ? 'Review your transcript'
          : "I'm listening...";

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={onBack} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice chat</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={onKeyboard} hitSlop={12}>
          <Ionicons name="menu-outline" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Center */}
      <View style={styles.center}>
        {isProcessing ? (
          <View style={styles.orbWrap}>
            <ActivityIndicator size="large" color={Colors.accentDark} />
          </View>
        ) : (
          <ListeningOrb active={isListening} />
        )}
        <Text style={styles.status}>{statusLabel}</Text>
        <TranscriptDisplay text={transcript} processing={isProcessing} />
      </View>

      {/* Bottom controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.sideBtn} onPress={onKeyboard} activeOpacity={0.8}>
          <Ionicons name="keypad-outline" size={22} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.stopBtn}
          onPress={onCancel}
          activeOpacity={0.9}
          disabled={isProcessing}
        >
          <View style={styles.stopGlow} />
          <View style={styles.stopInner}>
            <Ionicons name="close" size={28} color={Colors.text} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sideBtn, (confirmDisabled || !showCheckEnabled) && styles.sideBtnDisabled]}
          onPress={onConfirm}
          activeOpacity={0.8}
          disabled={confirmDisabled || !showCheckEnabled}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={Colors.textMuted} />
          ) : (
            <Ionicons name="checkmark" size={24} color={Colors.textMuted} />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const ORB_SIZE = 200;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontFamily: Fonts.body,
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  orbWrap: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  orbLayer: {
    position: 'absolute',
    borderRadius: ORB_SIZE / 2,
  },
  orbGlow: {
    width: ORB_SIZE + 40,
    height: ORB_SIZE + 40,
    backgroundColor: Colors.accentGlow,
    opacity: 0.6,
  },
  orbGreen: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    backgroundColor: '#C6F432',
    opacity: 0.85,
    left: -20,
  },
  orbYellow: {
    width: ORB_SIZE * 0.85,
    height: ORB_SIZE * 0.85,
    backgroundColor: '#E8F5A0',
    opacity: 0.7,
    right: -10,
    top: 20,
  },
  orbTeal: {
    width: ORB_SIZE * 0.7,
    height: ORB_SIZE * 0.7,
    backgroundColor: '#B0F1DC',
    opacity: 0.75,
    right: 0,
    top: -10,
  },
  status: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textDim,
    marginBottom: Spacing.xl,
  },
  transcriptWrap: {
    width: '100%',
    minHeight: 80,
  },
  transcriptPlaceholder: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.textDim,
    lineHeight: 24,
    textAlign: 'left',
  },
  transcript: {
    fontFamily: Fonts.body,
    fontSize: 20,
    lineHeight: 30,
    textAlign: 'left',
  },
  transcriptSolid: {
    color: Colors.text,
    fontWeight: '600',
  },
  transcriptTail: {
    color: Colors.textDim,
    fontWeight: '400',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.lg,
  },
  sideBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sideBtnDisabled: {
    opacity: 0.45,
  },
  stopBtn: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopGlow: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.accentGlow,
  },
  stopInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accentDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
});
