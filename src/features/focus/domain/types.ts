export type FocusSessionType = 'focus' | 'short_break' | 'long_break';

export interface FocusSession {
  _id: string;
  userId: string;
  type: FocusSessionType;
  durationMinutes: number;
  startedAt: string;
  endedAt: string | null;
  completed: boolean;
}

export const FOCUS_DURATIONS: Record<FocusSessionType, number> = {
  focus: 25,
  short_break: 5,
  long_break: 15,
};
