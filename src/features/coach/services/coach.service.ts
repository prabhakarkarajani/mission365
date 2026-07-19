import { createAIProvider } from '@/ai';
import type { ChatInput, ChatResponse } from '@/ai';

import type { GeneratedRoadmap, RoadmapGenerationInput } from '../types/coach.types';

export function generateRoadmap(input: RoadmapGenerationInput): Promise<GeneratedRoadmap> {
  return createAIProvider().generateRoadmap(input);
}

export function chatWithCoach(input: ChatInput): Promise<ChatResponse> {
  return createAIProvider().chat(input);
}
