import { useEffect } from 'react';

import {
  hasNotificationPermission,
  requestNotificationPermissions,
  syncHabitReminders,
} from '@/shared/lib/notifications';

import type { Habit } from '../domain/types';

export function useSyncHabitReminders(habits: Habit[] | undefined) {
  useEffect(() => {
    if (!habits) return;

    (async () => {
      const hasActiveReminder = habits.some((h) => h.reminderTime);

      // Only prompt for permission when the user has actually set a
      // reminder — never ask proactively. If permission was already
      // granted, still reconcile silently so removed reminders get
      // cancelled instead of firing forever.
      const granted = hasActiveReminder
        ? await requestNotificationPermissions()
        : await hasNotificationPermission();

      if (!granted) return;
      await syncHabitReminders(habits);
    })();
  }, [habits]);
}
