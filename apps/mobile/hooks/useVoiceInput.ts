import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { Alert } from 'react-native';
import { API_BASE_URL } from '../services/config';

export type VoiceState = 'idle' | 'requesting' | 'recording' | 'processing' | 'error';

interface UseVoiceInputReturn {
  voiceState: VoiceState;
  startRecording: () => Promise<void>;
  stopAndTranscribe: () => Promise<string | null>;
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
          'Please enable microphone access in settings to use voice input.',
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

  const stopAndTranscribe = useCallback(async (): Promise<string | null> => {
    if (!recordingRef.current) return null;

    clearTimer();
    setVoiceState('processing');

    try {
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setRecordingDuration(0);

      if (!uri) {
        setVoiceState('idle');
        return null;
      }

      // Read audio as base64 using fetch
      const audioFetch = await fetch(uri);
      const audioBlob = await audioFetch.blob();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // strip data:...;base64, prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      // Send to backend for Whisper transcription
      const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64Audio, mimeType: 'audio/m4a' }),
      });

      const data = await response.json();
      setVoiceState('idle');

      if (!response.ok || !data.text) {
        Alert.alert('Transcription failed', data.error || 'Could not transcribe audio.');
        return null;
      }

      return data.text;

    } catch (err) {
      console.error('Failed to transcribe:', err);
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
    stopAndTranscribe,
    cancelRecording,
    recordingDuration,
  };
}