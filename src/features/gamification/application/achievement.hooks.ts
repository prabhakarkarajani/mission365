import { useQuery } from '@tanstack/react-query';

import * as achievementApi from '../infrastructure/achievement.api';

export function useAchievements() {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: () => achievementApi.listAchievements().then((r) => r.achievements),
  });
}
