import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/application/auth.store';
import { useAchievementToastStore } from '@/features/gamification/application/achievement-toast.store';

import * as focusApi from '../infrastructure/focus.api';
import type { FocusSessionType } from '../domain/types';

export const focusKeys = { all: ['focus'] as const };

export function useFocusSessions(start?: string, end?: string) {
  return useQuery({
    queryKey: [...focusKeys.all, start, end],
    queryFn: () => focusApi.listSessions(start, end).then((r) => r.sessions),
  });
}

export function useStartFocusSession() {
  return useMutation({
    mutationFn: ({ type, durationMinutes }: { type: FocusSessionType; durationMinutes: number }) =>
      focusApi.startSession(type, durationMinutes),
  });
}

export function useCompleteFocusSession() {
  const queryClient = useQueryClient();
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const pushAchievements = useAchievementToastStore((s) => s.push);

  return useMutation({
    mutationFn: ({ sessionId, completed }: { sessionId: string; completed: boolean }) =>
      focusApi.completeSession(sessionId, completed),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: focusKeys.all });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      refreshUser();
      pushAchievements(result.unlockedAchievements);
    },
  });
}
