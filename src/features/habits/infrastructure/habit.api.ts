import { api } from '@/shared/lib/api-client';
import type { UnlockedAchievement } from '@/features/gamification/domain/types';

import type { Habit, HabitCategory, HabitFrequencyType, HabitLogEntry, TodayMission } from '../domain/types';

export interface CreateHabitInput {
  name: string;
  category?: HabitCategory;
  icon?: string;
  color?: string;
  frequency?: { type?: HabitFrequencyType; daysOfWeek?: number[] };
  reminderTime?: string | null;
}

export type UpdateHabitInput = Partial<CreateHabitInput>;

export function listHabits() {
  return api.get<{ habits: Habit[] }>('/habits');
}

export function getTodayMissions() {
  return api.get<{ date: string; missions: TodayMission[] }>('/habits/today');
}

export function getHabitLogs(start: string, end: string) {
  return api.get<{ logs: HabitLogEntry[] }>('/habits/logs', { start, end });
}

export function createHabit(input: CreateHabitInput) {
  return api.post<{ habit: Habit }>('/habits', input);
}

export function updateHabit(habitId: string, input: UpdateHabitInput) {
  return api.patch<{ habit: Habit }>(`/habits/${habitId}`, input);
}

export function deleteHabit(habitId: string) {
  return api.delete<{ deleted: true }>(`/habits/${habitId}`);
}

export function archiveHabit(habitId: string) {
  return api.post<{ habit: Habit }>(`/habits/${habitId}/archive`);
}

export function setHabitCompletion(habitId: string, date: string, completed: boolean) {
  return api.post<{ habit: Habit; unlockedAchievements: UnlockedAchievement[] }>(
    `/habits/${habitId}/completion`,
    { date, completed }
  );
}
