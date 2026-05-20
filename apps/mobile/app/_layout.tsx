import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Colors } from '../services/theme';
import { hasCompletedOnboarding } from './onboarding';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  const [loaded] = useFonts({
    DMSerifDisplay: require('../assets/fonts/DMSerifDisplay-Regular.ttf'),
    DMSans: require('../assets/fonts/DMSans-Regular.ttf'),
    'DMSans-Medium': require('../assets/fonts/DMSans-Medium.ttf'),
    'DMSans-SemiBold': require('../assets/fonts/DMSans-SemiBold.ttf'),
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    async function init() {
      const done = await hasCompletedOnboarding();
      setOnboardingDone(done);
    }
    init();
  }, []);

  useEffect(() => {
    if (loaded && onboardingDone !== null) {
      SplashScreen.hideAsync();
    }
  }, [loaded, onboardingDone]);

  if (!loaded || onboardingDone === null) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.bg },
        }}
        initialRouteName={onboardingDone ? '(tabs)' : 'onboarding'}
      >
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="result" />
      </Stack>
    </>
  );
}