import { createAIProvider } from '@/ai';

import type { GeneratedRoadmap, RoadmapGenerationInput } from '../types/coach.types';

export function generateRoadmap(input: RoadmapGenerationInput): Promise<GeneratedRoadmap> {
  return createAIProvider().generateRoadmap(input);
}
