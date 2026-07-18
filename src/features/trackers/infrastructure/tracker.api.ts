import { api } from '@/shared/lib/api-client';
import type { UnlockedAchievement } from '@/features/gamification/domain/types';

import type { TrackerKind, TrackerLog, TrackerSummary } from '../domain/types';

export interface CreateLogInput {
  kind: TrackerKind;
  value: number;
  unit?: string;
  date?: string;
  meta?: { workoutType?: string; sleepQuality?: string };
}

export function listLogs(kind?: TrackerKind, start?: string, end?: string) {
  return api.get<{ logs: TrackerLog[] }>('/trackers', { kind, start, end });
}

export function createLog(input: CreateLogInput) {
  return api.post<{ log: TrackerLog; unlockedAchievements: UnlockedAchievement[] }>('/trackers', input);
}

export function deleteLog(logId: string) {
  return api.delete<{ deleted: true }>(`/trackers/${logId}`);
}

export function getSummary(date?: string) {
  return api.get<TrackerSummary>('/trackers/summary', date ? { date } : undefined);
}
