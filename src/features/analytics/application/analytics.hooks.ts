import { useQuery } from '@tanstack/react-query';

import * as analyticsApi from '../infrastructure/analytics.api';

export function useAnalyticsSummary() {
  return useQuery({ queryKey: ['analytics', 'summary'], queryFn: analyticsApi.getSummary });
}
