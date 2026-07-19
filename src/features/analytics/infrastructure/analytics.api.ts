import { api } from '@/shared/lib/api-client';

import type { AnalyticsSummary } from '../domain/types';

export function getSummary(days?: number) {
  return api.get<AnalyticsSummary>('/analytics/summary', days ? { days } : undefined);
}
