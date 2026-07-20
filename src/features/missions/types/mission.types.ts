export type MissionType =
  | 'HABIT'
  | 'ONE_TIME'
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'PROJECT'
  | 'AI_SUGGESTED';

export type MissionPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'OPTIONAL';

/**
 * A client-side projection over a mission's backing source (Habit today;
 * see ADR-002, docs/adr/0002-mission-projection-over-habit.md). Not a
 * persisted entity - `id` is always the backing source's own id.
 */
export interface Mission {
  id: string;
  title: string;
  missionType: MissionType;
  /** The backing entity's id in its origin system (a Habit's _id today). */
  source: string;
  completedToday: boolean;
  skippedToday: boolean;
}
