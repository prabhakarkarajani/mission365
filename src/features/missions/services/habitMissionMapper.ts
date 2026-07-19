import type { Habit } from '@/features/habits/domain/types';
import type { Mission } from '../types/mission.types';

/**
 * Maps an existing Habit onto the new Mission abstraction. One-directional:
 * Habit stays the source of truth and nothing writes back through Mission yet.
 */
export function habitToMission(habit: Habit): Mission {
  return {
    id: habit._id,
    title: habit.name,
    type: 'HABIT',
    priority: 'MEDIUM',
    status: habit.isArchived ? 'CANCELLED' : 'UPCOMING',
    reminderTime: habit.reminderTime,
    recurrence: {
      type: habit.frequency.type,
      daysOfWeek: habit.frequency.daysOfWeek,
    },
    sourceHabitId: habit._id,
  };
}
