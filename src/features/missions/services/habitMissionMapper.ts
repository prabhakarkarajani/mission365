import type { TodayMission } from '@/features/habits/domain/types';
import type { Mission } from '../types/mission.types';

/**
 * Maps a Habit's today-instance onto the Mission projection (see ADR-002).
 * One-directional: Habit stays the source of truth and mutations delegate
 * back to it via useMissionActions(), not through this function.
 */
export function habitToMission(todayMission: TodayMission): Mission {
  const { habit } = todayMission;
  return {
    id: habit._id,
    title: habit.name,
    missionType: 'HABIT',
    source: habit._id,
    completedToday: todayMission.completed,
    skippedToday: todayMission.skipped,
  };
}
