export type TrackerKind = 'water' | 'workout' | 'sleep';

export interface TrackerLog {
  _id: string;
  userId: string;
  kind: TrackerKind;
  date: string;
  value: number;
  unit: string;
  meta: {
    workoutType: string | null;
    sleepQuality: 'poor' | 'fair' | 'good' | 'excellent' | null;
  };
  createdAt: string;
}

export interface TrackerSummary {
  date: string;
  water: number;
  workoutMinutes: number;
  sleepHours: number | null;
  waterStreak: number;
}
