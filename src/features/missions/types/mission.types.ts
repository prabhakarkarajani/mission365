export type MissionType =
  | 'HABIT'
  | 'ONE_TIME'
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'PROJECT'
  | 'AI_SUGGESTED';

export type MissionPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'OPTIONAL';

export type MissionStatus =
  | 'UPCOMING'
  | 'PENDING'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'POSTPONED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface MissionRecurrence {
  type: 'daily' | 'weekly' | 'custom';
  daysOfWeek: number[];
}

export interface Mission {
  id: string;
  title: string;
  type: MissionType;
  priority: MissionPriority;
  status: MissionStatus;
  reminderTime: string | null;
  recurrence?: MissionRecurrence;
  /** Present when this Mission is a view over an existing Habit record. */
  sourceHabitId?: string;
}
