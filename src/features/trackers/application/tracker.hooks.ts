import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/application/auth.store';
import { useAchievementToastStore } from '@/features/gamification/application/achievement-toast.store';

import * as trackerApi from '../infrastructure/tracker.api';
import type { CreateLogInput } from '../infrastructure/tracker.api';
import type { TrackerKind } from '../domain/types';

export const trackerKeys = {
  all: ['trackers'] as const,
  summary: (date?: string) => ['trackers', 'summary', date ?? 'today'] as const,
};

function useInvalidateAfterTrackerChange() {
  const queryClient = useQueryClient();
  const refreshUser = useAuthStore((s) => s.refreshUser);
  return () => {
    queryClient.invalidateQueries({ queryKey: trackerKeys.all });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
    queryClient.invalidateQueries({ queryKey: ['achievements'] });
    refreshUser();
  };
}

export function useTrackerSummary(date?: string) {
  return useQuery({ queryKey: trackerKeys.summary(date), queryFn: () => trackerApi.getSummary(date) });
}

export function useTrackerLogs(kind?: TrackerKind, start?: string, end?: string) {
  return useQuery({
    queryKey: [...trackerKeys.all, kind, start, end],
    queryFn: () => trackerApi.listLogs(kind, start, end).then((r) => r.logs),
  });
}

export function useCreateTrackerLog() {
  const invalidate = useInvalidateAfterTrackerChange();
  const pushAchievements = useAchievementToastStore((s) => s.push);
  return useMutation({
    mutationFn: (input: CreateLogInput) => trackerApi.createLog(input),
    onSuccess: (result) => {
      invalidate();
      pushAchievements(result.unlockedAchievements);
    },
  });
}

export function useDeleteTrackerLog() {
  const invalidate = useInvalidateAfterTrackerChange();
  return useMutation({
    mutationFn: (logId: string) => trackerApi.deleteLog(logId),
    onSuccess: invalidate,
  });
}
