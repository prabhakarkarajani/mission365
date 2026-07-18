import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/application/auth.store';
import { useAchievementToastStore } from '@/features/gamification/application/achievement-toast.store';

import * as goalApi from '../infrastructure/goal.api';
import type { CreateGoalInput, UpdateGoalInput } from '../infrastructure/goal.api';
import type { GoalStatus } from '../domain/types';

export const goalKeys = {
  all: ['goals'] as const,
  list: (status?: GoalStatus) => ['goals', status ?? 'all'] as const,
};

function useInvalidateAfterGoalChange() {
  const queryClient = useQueryClient();
  const refreshUser = useAuthStore((s) => s.refreshUser);
  return () => {
    queryClient.invalidateQueries({ queryKey: goalKeys.all });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
    queryClient.invalidateQueries({ queryKey: ['achievements'] });
    refreshUser();
  };
}

export function useGoals(status?: GoalStatus) {
  return useQuery({
    queryKey: goalKeys.list(status),
    queryFn: () => goalApi.listGoals(status).then((r) => r.goals),
  });
}

export function useCreateGoal() {
  const invalidate = useInvalidateAfterGoalChange();
  return useMutation({
    mutationFn: (input: CreateGoalInput) => goalApi.createGoal(input),
    onSuccess: invalidate,
  });
}

export function useUpdateGoal() {
  const invalidate = useInvalidateAfterGoalChange();
  return useMutation({
    mutationFn: ({ goalId, input }: { goalId: string; input: UpdateGoalInput }) =>
      goalApi.updateGoal(goalId, input),
    onSuccess: invalidate,
  });
}

export function useDeleteGoal() {
  const invalidate = useInvalidateAfterGoalChange();
  return useMutation({
    mutationFn: (goalId: string) => goalApi.deleteGoal(goalId),
    onSuccess: invalidate,
  });
}

export function useUpdateGoalProgress() {
  const invalidate = useInvalidateAfterGoalChange();
  const pushAchievements = useAchievementToastStore((s) => s.push);
  return useMutation({
    mutationFn: ({ goalId, currentValue }: { goalId: string; currentValue: number }) =>
      goalApi.updateGoalProgress(goalId, currentValue),
    onSuccess: (result) => {
      invalidate();
      pushAchievements(result.unlockedAchievements);
    },
  });
}

export function useSetMilestone() {
  const invalidate = useInvalidateAfterGoalChange();
  return useMutation({
    mutationFn: ({
      goalId,
      milestoneId,
      completed,
    }: {
      goalId: string;
      milestoneId: string;
      completed: boolean;
    }) => goalApi.setMilestone(goalId, milestoneId, completed),
    onSuccess: invalidate,
  });
}
