import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/application/auth.store';
import { useAchievementToastStore } from '@/features/gamification/application/achievement-toast.store';

import * as habitApi from '../infrastructure/habit.api';
import type { CreateHabitInput, UpdateHabitInput } from '../infrastructure/habit.api';

export const habitKeys = {
  all: ['habits'] as const,
  today: ['habits', 'today'] as const,
  logs: (start: string, end: string) => ['habits', 'logs', start, end] as const,
};

function useInvalidateAfterHabitChange() {
  const queryClient = useQueryClient();
  const refreshUser = useAuthStore((s) => s.refreshUser);

  return () => {
    queryClient.invalidateQueries({ queryKey: habitKeys.all });
    queryClient.invalidateQueries({ queryKey: habitKeys.today });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
    queryClient.invalidateQueries({ queryKey: ['achievements'] });
    refreshUser();
  };
}

export function useHabits() {
  return useQuery({ queryKey: habitKeys.all, queryFn: () => habitApi.listHabits().then((r) => r.habits) });
}

export function useTodayMissions() {
  return useQuery({ queryKey: habitKeys.today, queryFn: habitApi.getTodayMissions });
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
    mutationFn: (input: CreateHabitInput) => habitApi.createHabit(input),
    onSuccess: invalidate,
  });
}

export function useUpdateHabit() {
  const invalidate = useInvalidateAfterHabitChange();
  return useMutation({
    mutationFn: ({ habitId, input }: { habitId: string; input: UpdateHabitInput }) =>
      habitApi.updateHabit(habitId, input),
    onSuccess: invalidate,
  });
}

export function useDeleteHabit() {
  const invalidate = useInvalidateAfterHabitChange();
  return useMutation({
    mutationFn: (habitId: string) => habitApi.deleteHabit(habitId),
    onSuccess: invalidate,
  });
}

export function useArchiveHabit() {
  const invalidate = useInvalidateAfterHabitChange();
  return useMutation({
    mutationFn: (habitId: string) => habitApi.archiveHabit(habitId),
    onSuccess: invalidate,
  });
}

export function useToggleHabitCompletion() {
  const invalidate = useInvalidateAfterHabitChange();
  const pushAchievements = useAchievementToastStore((s) => s.push);

  return useMutation({
    mutationFn: ({ habitId, date, completed }: { habitId: string; date: string; completed: boolean }) =>
      habitApi.setHabitCompletion(habitId, date, completed),
    onSuccess: (result) => {
      invalidate();
      pushAchievements(result.unlockedAchievements);
    },
  });
}
