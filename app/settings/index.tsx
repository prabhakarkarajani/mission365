import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';

import { Button, Card, ModalHeader, SettingRow, SettingSwitch, Text } from '@/shared/ui';
import { useAuthStore } from '@/features/auth/application/auth.store';
import { useDeleteAccount, useUpdateProfile } from '@/features/profile/application/user.hooks';
import { cancelDailyReminder, scheduleDailyReminder } from '@/shared/lib/notifications';

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const { colorScheme, setColorScheme } = useColorScheme();
  const updateProfile = useUpdateProfile();
  const deleteAccount = useDeleteAccount();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const isDark = colorScheme === 'dark';

  const onToggleDarkMode = (value: boolean) => {
    const next = value ? 'dark' : 'light';
    setColorScheme(next);
    updateProfile.mutate({ appearance: { colorScheme: next } });
  };

  const onToggleNotification = (key: 'dailyReminder' | 'streakAlerts' | 'goalMilestones', value: boolean) => {
    updateProfile.mutate({ notificationPreferences: { [key]: value } });
    if (key === 'dailyReminder') {
      if (value) {
        scheduleDailyReminder();
      } else {
        cancelDailyReminder();
      }
    }
  };

  const onDeleteAccount = async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    await deleteAccount.mutateAsync();
    router.replace('/');
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ModalHeader title="Settings" />
      <ScrollView contentContainerClassName="gap-5 px-6 pb-8">
        <View className="gap-2">
          <Text variant="bodySmall" color="muted">
            Appearance
          </Text>
          <Card>
            <SettingRow
              label="Dark Mode"
              description="Switch between light and dark theme"
              right={<SettingSwitch value={isDark} onValueChange={onToggleDarkMode} />}
            />
          </Card>
        </View>

        <View className="gap-2">
          <Text variant="bodySmall" color="muted">
            Notifications
          </Text>
          <Card className="divide-y divide-border dark:divide-border-dark">
            <SettingRow
              label="Daily Reminder"
              description="Get reminded to check your missions"
              right={
                <SettingSwitch
                  value={user?.notificationPreferences.dailyReminder ?? true}
                  onValueChange={(v) => onToggleNotification('dailyReminder', v)}
                />
              }
            />
            <SettingRow
              label="Streak Alerts"
              description="Warnings before you lose a streak"
              right={
                <SettingSwitch
                  value={user?.notificationPreferences.streakAlerts ?? true}
                  onValueChange={(v) => onToggleNotification('streakAlerts', v)}
                />
              }
            />
            <SettingRow
              label="Goal Milestones"
              description="Celebrate progress on your goals"
              right={
                <SettingSwitch
                  value={user?.notificationPreferences.goalMilestones ?? true}
                  onValueChange={(v) => onToggleNotification('goalMilestones', v)}
                />
              }
            />
          </Card>
        </View>

        <View className="gap-2">
          <Text variant="bodySmall" color="muted">
            Privacy
          </Text>
          <Card className="gap-3">
            <Text variant="bodySmall" color="muted">
              Deleting your account permanently removes all your habits, goals, journal
              entries, and progress. This cannot be undone.
            </Text>
            <Button
              label={confirmingDelete ? 'Tap again to confirm delete' : 'Delete Account'}
              variant={confirmingDelete ? 'primary' : 'outline'}
              className={confirmingDelete ? 'bg-danger' : undefined}
              loading={deleteAccount.isPending}
              onPress={onDeleteAccount}
            />
            {confirmingDelete ? (
              <Button label="Cancel" variant="ghost" onPress={() => setConfirmingDelete(false)} />
            ) : null}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
