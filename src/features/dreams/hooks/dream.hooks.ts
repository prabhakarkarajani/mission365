import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as dreamApi from '../services/dream.api';
import type { CreateDreamInput, UpdateDreamInput } from '../services/dream.api';
import type { DreamStatus } from '../types/dream.types';

export const dreamKeys = {
  all: ['dreams'] as const,
  list: (status?: DreamStatus) => ['dreams', status ?? 'all'] as const,
};

function useInvalidateAfterDreamChange() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: dreamKeys.all });
}

export function useDreams(status?: DreamStatus) {
  return useQuery({
    queryKey: dreamKeys.list(status),
    queryFn: () => dreamApi.listDreams(status).then((r) => r.dreams),
  });
}

export function useCreateDream() {
  const invalidate = useInvalidateAfterDreamChange();
  return useMutation({
    mutationFn: (input: CreateDreamInput) => dreamApi.createDream(input),
    onSuccess: invalidate,
  });
}

export function useUpdateDream() {
  const invalidate = useInvalidateAfterDreamChange();
  return useMutation({
    mutationFn: ({ dreamId, input }: { dreamId: string; input: UpdateDreamInput }) =>
      dreamApi.updateDream(dreamId, input),
    onSuccess: invalidate,
  });
}

export function useDeleteDream() {
  const invalidate = useInvalidateAfterDreamChange();
  return useMutation({
    mutationFn: (dreamId: string) => dreamApi.deleteDream(dreamId),
    onSuccess: invalidate,
  });
}
