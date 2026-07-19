import type { AIProvider, GeneratedRoadmap, RoadmapGenerationInput } from '../../core/interfaces/AIProvider';

/**
 * Deterministic, zero-config provider. Used whenever no real vendor is
 * configured so the Coach feature works out of the box without an API key.
 */
function generateMockRoadmap(input: RoadmapGenerationInput): GeneratedRoadmap {
  return {
    summary: `A focused plan to help you achieve "${input.goalTitle}", broken into small, repeatable steps.`,
    milestones: [
      { title: 'Define the concrete outcome', description: 'Write down exactly what success looks like.', targetOffsetDays: 3 },
      { title: 'Build the first habit', description: 'Start the smallest recurring action that moves you forward.', targetOffsetDays: 7 },
      { title: 'Review and adjust', description: 'Check progress and refine the plan.', targetOffsetDays: 30 },
    ],
    suggestedMissions: [
      { title: `Daily check-in on "${input.goalTitle}"`, type: 'DAILY', priority: 'HIGH', recurrenceHint: 'Every day' },
      { title: 'Weekly progress review', type: 'WEEKLY', priority: 'MEDIUM', recurrenceHint: 'Every Sunday' },
    ],
  };
}

export const mockProvider: AIProvider = {
  name: 'mock',
  generateRoadmap: async (input) => generateMockRoadmap(input),
};
