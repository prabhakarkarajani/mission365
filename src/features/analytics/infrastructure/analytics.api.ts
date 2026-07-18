import { api } from '@/shared/lib/api-client';

import type { AnalyticsSummary } from '../domain/types';

export function getSummary() {
  return api.get<AnalyticsSummary>('/analytics/summary');
}
