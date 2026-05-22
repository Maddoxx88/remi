import { Platform } from 'react-native';
import Constants from 'expo-constants';

/** Dev API host derived from Expo Metro (same machine as `npx expo start`). */
function getDevApiHost(): string {
  const debuggerHost = Constants.expoGoConfig?.debuggerHost;
  if (debuggerHost) {
    return debuggerHost.split(':')[0];
  }

  // iOS Simulator / Android emulator fallbacks
  if (Platform.OS === 'android') return '10.0.2.2';
  return 'localhost';
}

/** Set via EAS / `.env`: EXPO_PUBLIC_API_URL=https://your-api.onrender.com */
const PRODUCTION_API_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim() || 'https://YOUR_RENDER_URL.onrender.com';

export const API_BASE_URL = __DEV__
  ? `http://${getDevApiHost()}:3001`
  : PRODUCTION_API_URL;
