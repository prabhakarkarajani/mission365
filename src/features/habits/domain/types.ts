export type HabitCategory = 'morning' | 'health' | 'mind' | 'learn' | 'other';
export type HabitFrequencyType = 'daily' | 'weekly' | 'custom';

export interface HabitFrequency {
  type: HabitFrequencyType;
  daysOfWeek: number[];
}

export interface Habit {
  _id: string;
  userId: string;
  name: string;
  category: HabitCategory;
  icon: string;
  color: string;
  frequency: HabitFrequency;
  reminderTime: string | null;
  currentStreak: number;
  longestStreak: number;
  isArchived: boolean;
  goalId: string | null;
  milestoneId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TodayMission {
  habit: Habit;
  completed: boolean;
  skipped: boolean;
}

export interface HabitLogEntry {
  habitId: string;
  date: string;
  completedAt: string | null;
}
