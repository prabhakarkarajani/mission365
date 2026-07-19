import { Platform } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/application/auth.store';
import { useAchievementToastStore } from '@/features/gamification/application/achievement-toast.store';
import type { UnlockedAchievement } from '@/features/gamification/domain/types';
import { todayKey } from '@/shared/lib/date';

import * as habitApi from '../infrastructure/habit.api';
import type { CreateHabitInput, UpdateHabitInput } from '../infrastructure/habit.api';
import {
  archiveHabitLocal,
  createHabitLocal,
  deleteHabitLocal,
  getLocalHabits,
  getLocalTodayMissions,
  setCompletionLocal,
  updateHabitLocal,
} from '../infrastructure/habit.local';
import { runSync } from '../infrastructure/habit.sync';

// Web has no offline-sync SQLite support — it talks to the API directly,
// same as every other feature. Only native (iOS/Android) uses the local
// cache + background sync built for the Habits offline pilot.
const isWeb = Platform.OS === 'web';

export const habitKeys = {
  all: ['habits'] as const,
  today: ['habits', 'today'] as const,
  logs: (start: string, end: string) => ['habits', 'logs', start, end] as const,
};

function useInvalidateAfterHabitChange() {
  const queryClient = useQueryClient();
  const refreshUser = useAuthStore((s) => s.refreshUser);

  const invalidateLocal = () => {
    queryClient.invalidateQueries({ queryKey: habitKeys.all });
    queryClient.invalidateQueries({ queryKey: habitKeys.today });
  };

  if (isWeb) {
    return () => {
      invalidateLocal();
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      refreshUser();
    };
  }

  return () => {
    invalidateLocal();
    runSync().then(() => {
      invalidateLocal();
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      refreshUser();
    });
  };
}

export function useHabits() {
  return useQuery({
    queryKey: habitKeys.all,
    queryFn: () => (isWeb ? habitApi.listHabits().then((r) => r.habits) : getLocalHabits(false)),
  });
}

export function useTodayMissions() {
  return useQuery({
    queryKey: habitKeys.today,
    queryFn: async () => {
      if (isWeb) return habitApi.getTodayMissions();
      return { date: todayKey(), missions: await getLocalTodayMissions() };
    },
  });
}

export function useHabitLogs(start: string, end: string) {
  return useQuery({
    queryKey: habitKeys.logs(start, end),
    queryFn: () => habitApi.getHabitLogs(start, end).then((r) => r.logs),
  });
}

export function useCreateHabit() {
  const invalidate = useInvalidateAfterHabitChange();
  return useMutation({
    mutationFn: (input: CreateHabitInput) =>
      isWeb ? habitApi.createHabit(input).then((r) => r.habit) : createHabitLocal(input),
    onSuccess: invalidate,
  });
}

export function useUpdateHabit() {
  const invalidate = useInvalidateAfterHabitChange();
  return useMutation({
    mutationFn: ({ habitId, input }: { habitId: string; input: UpdateHabitInput }) =>
      isWeb ? habitApi.updateHabit(habitId, input).then(() => undefined) : updateHabitLocal(habitId, input),
    onSuccess: invalidate,
  });
}

export function useDeleteHabit() {
  const invalidate = useInvalidateAfterHabitChange();
  return useMutation({
    mutationFn: (habitId: string) =>
      isWeb ? habitApi.deleteHabit(habitId).then(() => undefined) : deleteHabitLocal(habitId),
    onSuccess: invalidate,
  });
}

export function useArchiveHabit() {
  const invalidate = useInvalidateAfterHabitChange();
  return useMutation({
    mutationFn: (habitId: string) =>
      isWeb ? habitApi.archiveHabit(habitId).then(() => undefined) : archiveHabitLocal(habitId),
    onSuccess: invalidate,
  });
}

export function useToggleHabitCompletion() {
  const invalidate = useInvalidateAfterHabitChange();
  const pushAchievements = useAchievementToastStore((s) => s.push);

  return useMutation({
    mutationFn: ({ habitId, date, completed }: { habitId: string; date: string; completed: boolean }) =>
      isWeb ? habitApi.setHabitCompletion(habitId, date, completed) : setCompletionLocal(habitId, date, completed),
    onSuccess: (result) => {
      invalidate();
      if (isWeb) {
        pushAchievements((result as unknown as { unlockedAchievements: UnlockedAchievement[] }).unlockedAchievements);
      }
    },
  });
}
