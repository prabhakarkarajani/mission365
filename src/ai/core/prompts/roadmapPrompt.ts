import type { RoadmapGenerationInput } from '../interfaces/AIProvider';

/**
 * Single source of truth for the roadmap-generation prompt. The mock
 * provider ignores this; real vendor providers (Phase 4) build their
 * request body around it.
 */
export function buildRoadmapPrompt(input: RoadmapGenerationInput): string {
  const parts = [
    `Generate a step-by-step roadmap for the following life goal: "${input.goalTitle}".`,
  ];
  if (input.goalCategory) parts.push(`Category: ${input.goalCategory}.`);
  if (input.targetDate) parts.push(`Target date: ${input.targetDate}.`);
  parts.push(
    'Respond with a short summary, a list of milestones (title, optional description, ' +
      'and days from today), and a list of suggested missions (title, type, priority).',
  );
  return parts.join(' ');
}
