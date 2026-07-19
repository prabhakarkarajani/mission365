import { useHabits } from '@/features/habits/application/habit.hooks';

import { habitToMission } from '../services/habitMissionMapper';
import type { Mission } from '../types/mission.types';

/**
 * Read-only unified view over every Mission source. Today the only backing
 * source is Habit; future Mission types (one-time, project, AI-suggested)
 * plug in here without touching the Habit feature.
 */
export function useMissions() {
  const habitsQuery = useHabits();

  const missions: Mission[] | undefined = habitsQuery.data?.map(habitToMission);

  return {
    ...habitsQuery,
    data: missions,
  };
}
