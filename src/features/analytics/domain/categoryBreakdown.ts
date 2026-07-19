import type { Habit, HabitCategory, HabitLogEntry } from '@/features/habits/domain/types';

export interface CategoryBreakdownEntry {
  category: HabitCategory;
  completed: number;
  possible: number;
  completionPercent: number;
}

const CATEGORY_LABELS: Record<HabitCategory, string> = {
  morning: 'Morning',
  health: 'Health',
  mind: 'Mind',
  learn: 'Learn',
  other: 'Other',
};

export { CATEGORY_LABELS };

function applicableDates(habit: Habit, dates: string[]): string[] {
  if (habit.frequency.type === 'daily') return dates;
  const days = habit.frequency.daysOfWeek ?? [];
  return dates.filter((d) => {
    const [y, m, day] = d.split('-').map(Number);
    const weekday = new Date(y, m - 1, day).getDay();
    return days.includes(weekday);
  });
}

/**
 * Real completion-rate breakdown by habit category over a set of dates —
 * "possible" accounts for each habit's actual recurrence (a weekly habit
 * isn't penalized for the days it was never scheduled).
 */
export function computeCategoryBreakdown(
  habits: Habit[],
  logs: HabitLogEntry[],
  dates: string[]
): CategoryBreakdownEntry[] {
  const completedByHabit = new Map<string, Set<string>>();
  for (const log of logs) {
    if (!log.completedAt) continue;
    const set = completedByHabit.get(log.habitId) ?? new Set<string>();
    set.add(log.date);
    completedByHabit.set(log.habitId, set);
  }

  const byCategory = new Map<HabitCategory, { completed: number; possible: number }>();
  for (const habit of habits) {
    if (habit.isArchived) continue;
    const scheduled = applicableDates(habit, dates);
    const completedDates = completedByHabit.get(habit._id) ?? new Set<string>();
    const completed = scheduled.filter((d) => completedDates.has(d)).length;

    const entry = byCategory.get(habit.category) ?? { completed: 0, possible: 0 };
    entry.completed += completed;
    entry.possible += scheduled.length;
    byCategory.set(habit.category, entry);
  }

  return Array.from(byCategory.entries())
    .map(([category, { completed, possible }]) => ({
      category,
      completed,
      possible,
      completionPercent: possible > 0 ? Math.round((completed / possible) * 100) : 0,
    }))
    .sort((a, b) => b.completionPercent - a.completionPercent);
}
