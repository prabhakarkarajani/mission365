import { api } from '@/shared/lib/api-client';
import type { UnlockedAchievement } from '@/features/gamification/domain/types';

import type { JournalEntry, Mood } from '../domain/types';

export interface CreateEntryInput {
  content: string;
  mood: Mood;
  date?: string;
  tags?: string[];
}

export type UpdateEntryInput = Partial<CreateEntryInput>;

export function listEntries(start?: string, end?: string) {
  return api.get<{ entries: JournalEntry[] }>('/journal', start && end ? { start, end } : undefined);
}

export function createEntry(input: CreateEntryInput) {
  return api.post<{ entry: JournalEntry; unlockedAchievements: UnlockedAchievement[] }>('/journal', input);
}

export function updateEntry(entryId: string, input: UpdateEntryInput) {
  return api.patch<{ entry: JournalEntry }>(`/journal/${entryId}`, input);
}

export function deleteEntry(entryId: string) {
  return api.delete<{ deleted: true }>(`/journal/${entryId}`);
}
