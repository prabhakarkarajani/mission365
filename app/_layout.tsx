import '../global.css';

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { useColorScheme } from 'nativewind';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import { queryClient } from '@/shared/lib/query-client';
import { initDb } from '@/shared/lib/db';
import { injectPwaMeta } from '@/shared/lib/pwaMeta';
import { useAuthStore } from '@/features/auth/application/auth.store';
import { AchievementToast } from '@/features/gamification/presentation/AchievementToast';
import { OfflineBanner } from '@/shared/ui';
import { cancelDailyReminder, hasNotificationPermission, scheduleDailyReminder } from '@/shared/lib/notifications';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const authStatus = useAuthStore((s) => s.status);
  const hydrate = useAuthStore((s) => s.hydrate);
  const savedColorScheme = useAuthStore((s) => s.user?.appearance.colorScheme);
  const dailyReminderEnabled = useAuthStore((s) => s.user?.notificationPreferences.dailyReminder);
  const [dbReady, setDbReady] = useState(false);
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    hydrate();
    initDb().then(() => setDbReady(true));
    injectPwaMeta();
  }, [hydrate]);

  // Settings' Dark Mode toggle only calls setColorScheme() for the current
  // session (see app/settings/index.tsx) - this re-applies the persisted
  // preference (cached at auth-store init, then kept fresh via hydrate())
  // on every launch/reload, so the choice survives a restart.
  useEffect(() => {
    if (savedColorScheme) {
      setColorScheme(savedColorScheme);
    }
  }, [savedColorScheme, setColorScheme]);

  // Same root cause as the Dark Mode fix above, different feature: Settings'
  // toggle (app/settings/index.tsx) only calls scheduleDailyReminder() /
  // cancelDailyReminder() for the current interaction, and the backend
  // defaults dailyReminder to true for every new user - so without this,
  // no user ever gets the notification actually scheduled on-device unless
  // they happen to flip the switch off and back on. Never proactively
  // requests permission here (matches useSyncHabitReminders' policy) - only
  // reconciles if permission was already granted some other way.
  useEffect(() => {
    if (dailyReminderEnabled === undefined) return;
    (async () => {
      if (!dailyReminderEnabled) {
        await cancelDailyReminder();
        return;
      }
      if (await hasNotificationPermission()) {
        await scheduleDailyReminder();
      }
    })();
  }, [dailyReminderEnabled]);

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
        <OfflineBanner />
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
