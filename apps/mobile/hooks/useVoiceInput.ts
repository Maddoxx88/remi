import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { Alert, Platform } from 'react-native';

export type VoiceState = 'idle' | 'requesting' | 'recording' | 'processing' | 'error';

interface UseVoiceInputReturn {
  voiceState: VoiceState;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  cancelRecording: () => Promise<void>;
  recordingDuration: number;
}

export function useVoiceInput(): UseVoiceInputReturn {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = useCallback(async () => {
    try {
      setVoiceState('requesting');

      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert(
          'Microphone Permission',
          'Please enable microphone access in your device settings to use voice input.',
        );
        setVoiceState('idle');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );

      recordingRef.current = recording;
      setVoiceState('recording');
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);

    } catch (err) {
      console.error('Failed to start recording:', err);
      setVoiceState('error');
      setTimeout(() => setVoiceState('idle'), 2000);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!recordingRef.current) return null;

    clearTimer();
    setVoiceState('processing');

    try {
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setRecordingDuration(0);
      setVoiceState('idle');

      // Return the URI — in production this would be sent to a transcription API
      // For now we return a placeholder to show the flow works
      return uri;
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setVoiceState('error');
      setTimeout(() => setVoiceState('idle'), 2000);
      return null;
    }
  }, []);

  const cancelRecording = useCallback(async () => {
    if (!recordingRef.current) return;
    clearTimer();
    try {
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    } catch {}
    recordingRef.current = null;
    setRecordingDuration(0);
    setVoiceState('idle');
  }, []);

  return {
    voiceState,
    startRecording,
    stopRecording,
    cancelRecording,
    recordingDuration,
  };
}