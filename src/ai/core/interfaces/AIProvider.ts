import type { Roadmap } from '@/features/roadmaps/types/roadmap.types';

export interface RoadmapGenerationInput {
  goalTitle: string;
  goalCategory?: string;
  targetDate?: string;
}

export type GeneratedRoadmap = Roadmap;

/**
 * Every vendor (OpenAI, Claude, Gemini, Groq, Ollama, mock) implements this
 * contract. Business logic (the Coach feature) depends only on this
 * interface, never on a vendor SDK directly.
 */
export interface AIProvider {
  readonly name: string;
  generateRoadmap(input: RoadmapGenerationInput): Promise<GeneratedRoadmap>;
}
