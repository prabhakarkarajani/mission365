import { useQuery } from '@tanstack/react-query';

import { getSuggestions } from '../infrastructure/coach.api';

export function useCoachSuggestions() {
  return useQuery({
    queryKey: ['coach', 'suggestions'],
    queryFn: async () => (await getSuggestions()).cards,
    staleTime: Infinity, // static list server-side in Phase 1 - no reason to refetch mid-session
  });
}
