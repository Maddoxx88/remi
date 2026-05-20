import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import VoiceInputScreen from '../components/VoiceInputScreen';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { setPendingTranscript } from '../services/voiceSession';

export default function VoiceScreen() {
  const router = useRouter();
  const [previewTranscript, setPreviewTranscript] = useState<string | null>(null);

  const {
    voiceState,
    startRecording,
    stopAndTranscribe,
    cancelRecording,
  } = useVoiceInput();

  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  const exitAndDiscard = useCallback(async () => {
    if (voiceState === 'recording' || voiceState === 'requesting') {
      await cancelRecording();
    }
    setPreviewTranscript(null);
    goBack();
  }, [voiceState, cancelRecording, goBack]);

  useFocusEffect(
    useCallback(() => {
      setPreviewTranscript(null);
      startRecording();
      return () => {
        cancelRecording();
      };
    }, [startRecording, cancelRecording]),
  );

  async function handleCancel() {
    await exitAndDiscard();
  }

  async function handleConfirm() {
    if (previewTranscript) {
      setPendingTranscript(previewTranscript);
      goBack();
      return;
    }

    if (voiceState !== 'recording') return;

    const text = await stopAndTranscribe();
    if (text) {
      setPreviewTranscript(text);
    }
  }

  return (
    <VoiceInputScreen
      voiceState={voiceState}
      transcript={previewTranscript}
      onBack={exitAndDiscard}
      onKeyboard={exitAndDiscard}
      onCancel={handleCancel}
      onConfirm={handleConfirm}
    />
  );
}
