import '../global.css';

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import { queryClient } from '@/shared/lib/query-client';
import { initDb } from '@/shared/lib/db';
import { useAuthStore } from '@/features/auth/application/auth.store';
import { AchievementToast } from '@/features/gamification/presentation/AchievementToast';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  const authStatus = useAuthStore((s) => s.status);
  const hydrate = useAuthStore((s) => s.hydrate);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    hydrate();
    initDb().then(() => setDbReady(true));
  }, [hydrate]);

  const authResolved = authStatus === 'authenticated' || authStatus === 'unauthenticated';

  useEffect(() => {
    if ((fontsLoaded || fontError) && authResolved && dbReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, authResolved, dbReady]);

  if ((!fontsLoaded && !fontError) || !authResolved || !dbReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
        <AchievementToast />
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
