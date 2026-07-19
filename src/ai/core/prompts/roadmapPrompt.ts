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
  if (input.currentLevel) parts.push(`Current level: ${input.currentLevel}.`);
  if (input.dailyTimeBudget) parts.push(`Daily time available: ${input.dailyTimeBudget}.`);
  if (input.preferredWorkingHours?.length) {
    parts.push(`Preferred working hours: ${input.preferredWorkingHours.join(', ')}.`);
  }
  if (input.challenges?.length) parts.push(`Current challenges: ${input.challenges.join(', ')}.`);
  parts.push(
    'Respond with a short summary, an estimated success percentage, a total timeline in days, ' +
      'a list of milestones (title, optional description, and days from today), a list of suggested ' +
      'missions (title, type, priority), and a concrete first-week plan of 5-7 missions each tagged ' +
      'with a day offset (0-6).',
  );
  return parts.join(' ');
}
