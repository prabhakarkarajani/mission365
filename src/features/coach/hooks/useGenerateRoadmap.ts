import { useMutation } from '@tanstack/react-query';

import { generateRoadmapLocally } from '@/features/roadmaps/domain/generateRoadmapLocally';
import type { RoadmapGenerationInput } from '@/features/roadmaps/types/roadmap.types';

export function useGenerateRoadmap() {
  return useMutation({
    mutationFn: async (input: RoadmapGenerationInput) => generateRoadmapLocally(input),
  });
}
