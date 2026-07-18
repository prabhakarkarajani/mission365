import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/application/auth.store';
import { useAchievementToastStore } from '@/features/gamification/application/achievement-toast.store';

import * as journalApi from '../infrastructure/journal.api';
import type { CreateEntryInput, UpdateEntryInput } from '../infrastructure/journal.api';

export const journalKeys = {
  all: ['journal'] as const,
};

function useInvalidateAfterJournalChange() {
  const queryClient = useQueryClient();
  const refreshUser = useAuthStore((s) => s.refreshUser);
  return () => {
    queryClient.invalidateQueries({ queryKey: journalKeys.all });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
    queryClient.invalidateQueries({ queryKey: ['achievements'] });
    refreshUser();
  };
}

export function useJournalEntries(start?: string, end?: string) {
  return useQuery({
    queryKey: [...journalKeys.all, start, end],
    queryFn: () => journalApi.listEntries(start, end).then((r) => r.entries),
  });
}

export function useCreateJournalEntry() {
  const invalidate = useInvalidateAfterJournalChange();
  const pushAchievements = useAchievementToastStore((s) => s.push);
  return useMutation({
    mutationFn: (input: CreateEntryInput) => journalApi.createEntry(input),
    onSuccess: (result) => {
      invalidate();
      pushAchievements(result.unlockedAchievements);
    },
  });
}

export function useUpdateJournalEntry() {
  const invalidate = useInvalidateAfterJournalChange();
  return useMutation({
    mutationFn: ({ entryId, input }: { entryId: string; input: UpdateEntryInput }) =>
      journalApi.updateEntry(entryId, input),
    onSuccess: invalidate,
  });
}

export function useDeleteJournalEntry() {
  const invalidate = useInvalidateAfterJournalChange();
  return useMutation({
    mutationFn: (entryId: string) => journalApi.deleteEntry(entryId),
    onSuccess: invalidate,
  });
}
