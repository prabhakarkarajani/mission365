import { useQuery } from '@tanstack/react-query';

import * as analyticsApi from '../infrastructure/analytics.api';

export function useAnalyticsSummary(days?: number) {
  return useQuery({
    queryKey: ['analytics', 'summary', days ?? 7],
    queryFn: () => analyticsApi.getSummary(days),
  });
}
