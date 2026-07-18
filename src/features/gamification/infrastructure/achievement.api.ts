import { api } from '@/shared/lib/api-client';

import type { Achievement } from '../domain/types';

export function listAchievements() {
  return api.get<{ achievements: Achievement[] }>('/achievements');
}
