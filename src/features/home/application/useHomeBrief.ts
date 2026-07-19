import { useMemo } from 'react';

import { useTodayMissions } from '@/features/habits/application/habit.hooks';
import { useGoals } from '@/features/goals/application/goal.hooks';
import { daysUntil } from '@/shared/lib/date';
import type { TodayMission } from '@/features/habits/domain/types';
import type { Goal, Milestone } from '@/features/goals/domain/types';

import { getMissionPresentation, PRIORITY_RANK, type MissionPriorityLevel } from '../domain/missionPresentation';

export interface BriefMission {
  mission: TodayMission;
  priority: MissionPriorityLevel;
  durationMinutes: number;
}

export interface HomeBrief {
  isLoading: boolean;
  missions: BriefMission[];
  completedCount: number;
  pendingCount: number;
  completionPercent: number;
  remainingMinutes: number;
  topPendingMission: BriefMission | null;
  nextReminder: BriefMission | null;
  currentGoal: Goal | null;
  currentMilestone: Milestone | null;
  daysRemaining: number | null;
  refetch: () => Promise<unknown>;
}

export function useHomeBrief(): HomeBrief {
  const { data: missionsData, isLoading: missionsLoading, refetch } = useTodayMissions();
  const { data: goals, isLoading: goalsLoading } = useGoals('active');

  const enriched = useMemo<BriefMission[]>(() => {
    const missions = missionsData?.missions ?? [];
    return missions.map((mission) => {
      const presentation = getMissionPresentation(mission.habit.category);
      return { mission, priority: presentation.priority, durationMinutes: presentation.durationMinutes };
    });
  }, [missionsData]);

  const completed = enriched.filter((e) => e.mission.completed);
  const pending = enriched.filter((e) => !e.mission.completed);
  const completionPercent = enriched.length > 0 ? (completed.length / enriched.length) * 100 : 0;
  const remainingMinutes = pending.reduce((sum, e) => sum + e.durationMinutes, 0);

  const topPendingMission =
    [...pending].sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])[0] ?? null;

  const nextReminder =
    [...pending]
      .filter((e) => e.mission.habit.reminderTime)
      .sort((a, b) => (a.mission.habit.reminderTime! < b.mission.habit.reminderTime! ? -1 : 1))[0] ?? null;

  const currentGoal = goals && goals.length > 0 ? goals[0] : null;
  const currentMilestone = currentGoal?.milestones.find((m) => !m.completed) ?? null;
  const daysRemaining = daysUntil(currentGoal?.deadline ?? null);

  return {
    isLoading: missionsLoading || goalsLoading,
    missions: enriched,
    completedCount: completed.length,
    pendingCount: pending.length,
    completionPercent,
    remainingMinutes,
    topPendingMission,
    nextReminder,
    currentGoal,
    currentMilestone,
    daysRemaining,
    refetch,
  };
}
