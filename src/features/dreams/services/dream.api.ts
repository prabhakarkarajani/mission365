import { api } from '@/shared/lib/api-client';

import type { Dream, DreamStatus } from '../types/dream.types';

export interface CreateDreamInput {
  title: string;
  description?: string;
  icon?: string;
  color?: string;
}

export type UpdateDreamInput = Partial<CreateDreamInput> & { status?: DreamStatus };

export function listDreams(status?: DreamStatus) {
  return api.get<{ dreams: Dream[] }>('/dreams', status ? { status } : undefined);
}

export function createDream(input: CreateDreamInput) {
  return api.post<{ dream: Dream }>('/dreams', input);
}

export function updateDream(dreamId: string, input: UpdateDreamInput) {
  return api.patch<{ dream: Dream }>(`/dreams/${dreamId}`, input);
}

export function deleteDream(dreamId: string) {
  return api.delete<{ deleted: true }>(`/dreams/${dreamId}`);
}
