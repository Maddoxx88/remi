import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import * as SplashScreen from 'expo-splash-screen';
import { Colors } from '../services/theme';
import { hasCompletedOnboarding } from './onboarding';

SplashScreen.preventAutoHideAsync();

const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: Colors.bg },
};

export default function RootLayout() {
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  const [loaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    hasCompletedOnboarding().then(setOnboardingDone);
  }, []);

  useEffect(() => {
    if (loaded && onboardingDone !== null) {
      SplashScreen.hideAsync();
    }
  }, [loaded, onboardingDone]);

  if (!loaded || onboardingDone === null) return null;

  // Expo Router ignores initialRouteName — split stacks so first launch always hits onboarding
  if (!onboardingDone) {
    return (
      <>
        <StatusBar style="dark" />
        <Stack screenOptions={screenOptions}>
          <Stack.Screen name="onboarding" />
        </Stack>
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={screenOptions}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="result" />
        <Stack.Screen
          name="voice"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </>
  );
}
