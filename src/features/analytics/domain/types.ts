export interface HabitCompletionPoint {
  date: string;
  completed: number;
  total: number;
  percent: number;
}

export interface MoodTrendPoint {
  date: string;
  moodScore: number | null;
}

export interface FocusMinutesPoint {
  date: string;
  minutes: number;
}

export interface AnalyticsSummary {
  level: number;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  weeklyHabitCompletionPercent: number;
  totalFocusMinutesThisWeek: number;
  habitCompletionSeries: HabitCompletionPoint[];
  moodTrendSeries: MoodTrendPoint[];
  focusMinutesSeries: FocusMinutesPoint[];
}
