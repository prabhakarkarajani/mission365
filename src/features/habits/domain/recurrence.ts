import type { HabitFrequency } from './types';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function recurrenceLabel(frequency: HabitFrequency): string {
  if (frequency.type === 'daily') return 'Daily';
  if (!frequency.daysOfWeek || frequency.daysOfWeek.length === 0) {
    return frequency.type === 'weekly' ? 'Weekly' : 'Custom';
  }
  return [...frequency.daysOfWeek].sort().map((d) => WEEKDAY_LABELS[d]).join(', ');
}
