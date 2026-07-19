import { useMemo } from 'react';

import { useHabitLogs, useHabits, useUpdateHabit } from '@/features/habits/application/habit.hooks';
import { subtractDays, todayKey } from '@/shared/lib/date';
import type { Habit, HabitLogEntry } from '@/features/habits/domain/types';

const LOOKBACK_DAYS = 28;
const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const LATE_HOUR_THRESHOLD = 20;
const DEFAULT_LATE_REMINDER = '20:30';

export interface TimeShiftSuggestion {
  type: 'time-shift';
  habitId: string;
  habitName: string;
  suggestedTime: string;
  message: string;
}

export interface WeekdayDipSuggestion {
  type: 'weekday-dip';
  habitId: string;
  habitName: string;
  weekdayLabel: string;
  message: string;
}

export type SmartSuggestion = TimeShiftSuggestion | WeekdayDipSuggestion;

/**
 * Pure — kept outside the hook so React Compiler can memoize the useMemo
 * call cleanly. Looks for two real, data-backed patterns across the last 28
 * days of habit logs: a habit consistently completed late, or one whose
 * completion rate dips hard on a specific weekday. Returns null rather than
 * forcing an insight when the data doesn't support one.
 */
function computeSuggestion(habits: Habit[] | undefined, logs: HabitLogEntry[] | undefined): SmartSuggestion | null {
  if (!habits || habits.length === 0 || !logs || logs.length < 6) return null;

  for (const habit of habits) {
    const completedLogs = logs.filter((l) => l.habitId === habit._id && l.completedAt);
    if (completedLogs.length < 5) continue;

    const lateCount = completedLogs.filter((l) => new Date(l.completedAt as string).getHours() >= LATE_HOUR_THRESHOLD).length;
    if (lateCount / completedLogs.length >= 0.7 && habit.reminderTime !== DEFAULT_LATE_REMINDER) {
      return {
        type: 'time-shift',
        habitId: habit._id,
        habitName: habit.name,
        suggestedTime: DEFAULT_LATE_REMINDER,
        message: `You consistently complete ${habit.name} after 8 PM. Move today's reminder later?`,
      };
    }
  }

  for (const habit of habits) {
    const habitLogs = logs.filter((l) => l.habitId === habit._id && l.completedAt);
    if (habitLogs.length < 8) continue;

    const byWeekday = new Map<number, number>();
    for (const log of habitLogs) {
      const [y, m, d] = log.date.split('-').map(Number);
      const weekday = new Date(y, m - 1, d).getDay();
      byWeekday.set(weekday, (byWeekday.get(weekday) ?? 0) + 1);
    }
    const avgPerWeekday = habitLogs.length / 7;
    if (avgPerWeekday < 1) continue;

    for (let weekday = 0; weekday < 7; weekday++) {
      const count = byWeekday.get(weekday) ?? 0;
      if (count < avgPerWeekday * 0.4) {
        return {
          type: 'weekday-dip',
          habitId: habit._id,
          habitName: habit.name,
          weekdayLabel: WEEKDAY_LABELS[weekday],
          message: `${habit.name} completion drops every ${WEEKDAY_LABELS[weekday]}. Want a lighter target that day?`,
        };
      }
    }
  }

  return null;
}

export function useSmartSuggestions() {
  const { data: habits } = useHabits();
  const start = subtractDays(todayKey(), LOOKBACK_DAYS);
  const end = todayKey();
  const { data: logs } = useHabitLogs(start, end);
  const updateHabit = useUpdateHabit();

  const suggestion = useMemo(() => computeSuggestion(habits, logs), [habits, logs]);

  const applyTimeShift = (s: TimeShiftSuggestion) => {
    updateHabit.mutate({ habitId: s.habitId, input: { reminderTime: s.suggestedTime } });
  };

  return { suggestion, applyTimeShift, isApplying: updateHabit.isPending };
}
