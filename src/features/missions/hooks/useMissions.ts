import { useTodayMissions } from '@/features/habits/application/habit.hooks';

import { habitToMission } from '../services/habitMissionMapper';
import type { Mission } from '../types/mission.types';

/**
 * Today's Mission projection (see ADR-002). Read-only unified view over
 * every Mission source; today the only backing source is Habit, so this
 * wraps useTodayMissions(). Future Mission types (one-time, project,
 * AI-suggested) plug in here without touching the Habit feature.
 */
export function useMissions() {
  const todayQuery = useTodayMissions();

  const missions: Mission[] | undefined = todayQuery.data?.missions.map(habitToMission);

  return {
    ...todayQuery,
    data: missions,
  };
}
