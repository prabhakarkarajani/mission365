import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const isSupported = Platform.OS === 'ios' || Platform.OS === 'android';

export async function hasNotificationPermission(): Promise<boolean> {
  if (!isSupported) return false;
  const existing = await Notifications.getPermissionsAsync();
  return existing.granted;
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!isSupported) return false;
  if (await hasNotificationPermission()) return true;
  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
}

function habitReminderId(habitId: string): string {
  return `habit-reminder-${habitId}`;
}

export async function scheduleHabitReminder(
  habitId: string,
  habitName: string,
  time: string
): Promise<void> {
  if (!isSupported) return;
  const [hour, minute] = time.split(':').map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return;

  await cancelHabitReminder(habitId);
  await Notifications.scheduleNotificationAsync({
    identifier: habitReminderId(habitId),
    content: {
      title: 'Mission365',
      body: `Time for: ${habitName}`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelHabitReminder(habitId: string): Promise<void> {
  if (!isSupported) return;
  await Notifications.cancelScheduledNotificationAsync(habitReminderId(habitId)).catch(() => undefined);
}

const HABIT_REMINDER_PREFIX = 'habit-reminder-';

/**
 * Reconciles scheduled habit reminders against the current habit list —
 * reschedules active ones and cancels any left over from deleted/edited
 * habits, since scheduled notifications otherwise persist forever.
 */
export async function syncHabitReminders(
  habits: { _id: string; name: string; reminderTime: string | null }[]
): Promise<void> {
  if (!isSupported) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const staleIds = scheduled
    .map((n) => n.identifier)
    .filter((id) => id.startsWith(HABIT_REMINDER_PREFIX))
    .filter((id) => !habits.some((h) => h.reminderTime && habitReminderId(h._id) === id));

  await Promise.all(staleIds.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined)));
  await Promise.all(
    habits
      .filter((h) => h.reminderTime)
      .map((h) => scheduleHabitReminder(h._id, h.name, h.reminderTime as string))
  );
}

const DAILY_REMINDER_ID = 'daily-missions-reminder';

export async function scheduleDailyReminder(hour = 9, minute = 0): Promise<void> {
  if (!isSupported) return;
  await cancelDailyReminder();
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: {
      title: 'Mission365',
      body: "Don't forget your daily missions!",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelDailyReminder(): Promise<void> {
  if (!isSupported) return;
  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => undefined);
}
