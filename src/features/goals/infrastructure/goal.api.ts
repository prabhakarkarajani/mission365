import { api } from '@/shared/lib/api-client';
import type { UnlockedAchievement } from '@/features/gamification/domain/types';

import type { Goal, GoalStatus } from '../domain/types';

export interface CreateGoalInput {
  title: string;
  category?: string;
  icon?: string;
  color?: string;
  targetValue: number;
  unit?: string;
  deadline?: string | null;
  milestones?: { title: string }[];
}

export type UpdateGoalInput = Partial<CreateGoalInput>;

export function listGoals(status?: GoalStatus) {
  return api.get<{ goals: Goal[] }>('/goals', status ? { status } : undefined);
}

export function createGoal(input: CreateGoalInput) {
  return api.post<{ goal: Goal }>('/goals', input);
}

export function updateGoal(goalId: string, input: UpdateGoalInput) {
  return api.patch<{ goal: Goal }>(`/goals/${goalId}`, input);
}

export function deleteGoal(goalId: string) {
  return api.delete<{ deleted: true }>(`/goals/${goalId}`);
}

export function updateGoalProgress(goalId: string, currentValue: number) {
  return api.post<{ goal: Goal; unlockedAchievements: UnlockedAchievement[] }>(
    `/goals/${goalId}/progress`,
    { currentValue }
  );
}

export function setMilestone(goalId: string, milestoneId: string, completed: boolean) {
  return api.post<{ goal: Goal }>(`/goals/${goalId}/milestones/${milestoneId}`, { completed });
}
