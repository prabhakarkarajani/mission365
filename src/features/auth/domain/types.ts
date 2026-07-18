export interface NotificationPreferences {
  dailyReminder: boolean;
  streakAlerts: boolean;
  goalMilestones: boolean;
}

export interface Appearance {
  colorScheme: 'light' | 'dark' | 'system';
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  timezone: string;
  level: number;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  notificationPreferences: NotificationPreferences;
  appearance: Appearance;
  createdAt: string;
}
