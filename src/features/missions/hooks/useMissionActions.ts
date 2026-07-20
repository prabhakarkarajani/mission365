import { useToggleHabitCompletion, useToggleHabitSkip } from '@/features/habits/application/habit.hooks';
import { todayKey } from '@/shared/lib/date';

import type { Mission } from '../types/mission.types';

/**
 * Mutations for a Mission always delegate to its backing source's own
 * service (see ADR-002) - never a Mission-owned mutation. Today that's
 * always Habit; the switch below is where a second source plugs in.
 */
export function useMissionActions() {
  const toggleCompletion = useToggleHabitCompletion();
  const toggleSkip = useToggleHabitSkip();

  function completeMission(mission: Mission, completed: boolean) {
    if (mission.missionType === 'HABIT') {
      toggleCompletion.mutate({ habitId: mission.source, date: todayKey(), completed });
    }
  }

  function skipMission(mission: Mission, skipped: boolean) {
    if (mission.missionType === 'HABIT') {
      toggleSkip.mutate({ habitId: mission.source, date: todayKey(), skipped });
    }
  }

  return {
    completeMission,
    skipMission,
    isPending: toggleCompletion.isPending || toggleSkip.isPending,
  };
}
