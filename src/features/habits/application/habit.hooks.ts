import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/application/auth.store';
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
  return useQuery({ queryKey: habitKeys.all, queryFn: () => getLocalHabits(false) });
}

export function useTodayMissions() {
  return useQuery({
    queryKey: habitKeys.today,
    queryFn: async () => ({ date: todayKey(), missions: await getLocalTodayMissions() }),
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
    mutationFn: (input: CreateHabitInput) => createHabitLocal(input),
    onSuccess: invalidate,
  });
}

export function useUpdateHabit() {
  const invalidate = useInvalidateAfterHabitChange();
  return useMutation({
    mutationFn: ({ habitId, input }: { habitId: string; input: UpdateHabitInput }) =>
      updateHabitLocal(habitId, input),
    onSuccess: invalidate,
  });
}

export function useDeleteHabit() {
  const invalidate = useInvalidateAfterHabitChange();
  return useMutation({
    mutationFn: (habitId: string) => deleteHabitLocal(habitId),
    onSuccess: invalidate,
  });
}

export function useArchiveHabit() {
  const invalidate = useInvalidateAfterHabitChange();
  return useMutation({
    mutationFn: (habitId: string) => archiveHabitLocal(habitId),
    onSuccess: invalidate,
  });
}

export function useToggleHabitCompletion() {
  const invalidate = useInvalidateAfterHabitChange();

  return useMutation({
    mutationFn: ({ habitId, date, completed }: { habitId: string; date: string; completed: boolean }) =>
      setCompletionLocal(habitId, date, completed),
    onSuccess: invalidate,
  });
}
