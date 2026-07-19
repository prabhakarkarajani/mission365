import type { HabitCategory } from '@/features/habits/domain/types';
import type { TextColor } from '@/shared/ui';

export type MissionPriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface MissionPresentation {
  priority: MissionPriorityLevel;
  durationMinutes: number;
  categoryLabel: string;
}

/**
 * Habit doesn't persist a priority or a duration estimate — this is a
 * display-only heuristic keyed by category, not a fact read from the
 * backend. Swap for real per-mission fields if/when the schema grows them.
 */
const PRESENTATION_BY_CATEGORY: Record<HabitCategory, MissionPresentation> = {
  health: { priority: 'CRITICAL', durationMinutes: 45, categoryLabel: 'Health' },
  morning: { priority: 'HIGH', durationMinutes: 20, categoryLabel: 'Morning' },
  mind: { priority: 'MEDIUM', durationMinutes: 15, categoryLabel: 'Mind' },
  learn: { priority: 'MEDIUM', durationMinutes: 30, categoryLabel: 'Learn' },
  other: { priority: 'LOW', durationMinutes: 15, categoryLabel: 'Other' },
};

export function getMissionPresentation(category: HabitCategory): MissionPresentation {
  return PRESENTATION_BY_CATEGORY[category];
}

export const PRIORITY_RANK: Record<MissionPriorityLevel, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export const PRIORITY_COLOR: Record<MissionPriorityLevel, TextColor> = {
  CRITICAL: 'danger',
  HIGH: 'warning',
  MEDIUM: 'primary',
  LOW: 'muted',
};
