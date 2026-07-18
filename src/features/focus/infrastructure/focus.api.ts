import { api } from '@/shared/lib/api-client';
import type { UnlockedAchievement } from '@/features/gamification/domain/types';

import type { FocusSession, FocusSessionType } from '../domain/types';

export function startSession(type: FocusSessionType, durationMinutes: number) {
  return api.post<{ session: FocusSession }>('/focus', { type, durationMinutes });
}

export function completeSession(sessionId: string, completed: boolean) {
  return api.post<{ session: FocusSession; unlockedAchievements: UnlockedAchievement[] }>(
    `/focus/${sessionId}/complete`,
    { completed }
  );
}

export function listSessions(start?: string, end?: string) {
  return api.get<{ sessions: FocusSession[] }>('/focus', start && end ? { start, end } : undefined);
}
