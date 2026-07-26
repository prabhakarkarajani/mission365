import type { GeneratedRoadmap, RoadmapGenerationInput, SuggestedMission } from '../types/roadmap.types';

/**
 * Deterministic, client-side roadmap generation - not an AI call. Ported
 * as-is from the old src/ai/providers/mock provider when the Coach chat
 * feature moved server-side (see docs/adr/0004-ai-coach-server-side.md).
 * A real backend-generated roadmap (POST /coach/roadmap) is deliberately
 * out of scope for that migration - self-contained, no dependency on
 * context-awareness/streaming/persistence, so it stays exactly as it
 * worked before until that's built as its own fast-follow.
 */

const TIME_BUDGET_DAYS: Record<NonNullable<RoadmapGenerationInput['dailyTimeBudget']>, number> = {
  under_30: 120,
  '30_60': 90,
  '1_2h': 60,
  '2h_plus': 45,
};

function computeTimelineDays(input: RoadmapGenerationInput): number {
  if (input.targetDate) {
    const days = Math.ceil((new Date(input.targetDate).getTime() - Date.now()) / 86_400_000);
    if (days > 0) return days;
  }
  return TIME_BUDGET_DAYS[input.dailyTimeBudget ?? '30_60'];
}

function computeSuccessPercent(input: RoadmapGenerationInput): number {
  let score = 70;
  if (input.currentLevel === 'intermediate') score += 8;
  if (input.currentLevel === 'advanced') score += 15;
  if (input.dailyTimeBudget === '1_2h') score += 6;
  if (input.dailyTimeBudget === '2h_plus') score += 10;
  if (input.dailyTimeBudget === 'under_30') score -= 8;
  score -= Math.min(20, (input.challenges?.length ?? 0) * 5);
  return Math.max(35, Math.min(96, score));
}

function buildFirstWeekMissions(input: RoadmapGenerationInput): SuggestedMission[] {
  const goal = input.goalTitle;
  return [
    { title: `Define what "${goal}" success looks like`, type: 'ONE_TIME', priority: 'HIGH', dayOffset: 0 },
    { title: `Daily check-in on "${goal}"`, type: 'DAILY', priority: 'HIGH', recurrenceHint: 'Every day', dayOffset: 1 },
    { title: `Daily check-in on "${goal}"`, type: 'DAILY', priority: 'HIGH', recurrenceHint: 'Every day', dayOffset: 2 },
    { title: `Daily check-in on "${goal}"`, type: 'DAILY', priority: 'MEDIUM', recurrenceHint: 'Every day', dayOffset: 3 },
    { title: `Daily check-in on "${goal}"`, type: 'DAILY', priority: 'MEDIUM', recurrenceHint: 'Every day', dayOffset: 4 },
    { title: `Daily check-in on "${goal}"`, type: 'DAILY', priority: 'MEDIUM', recurrenceHint: 'Every day', dayOffset: 5 },
    { title: 'Reflect on your first week and adjust the plan', type: 'ONE_TIME', priority: 'MEDIUM', dayOffset: 6 },
  ];
}

export function generateRoadmapLocally(input: RoadmapGenerationInput): GeneratedRoadmap {
  const timelineDays = computeTimelineDays(input);
  const firstWeekMissions = buildFirstWeekMissions(input);

  return {
    summary: `A focused plan to help you achieve "${input.goalTitle}" over the next ${timelineDays} days, broken into small, repeatable steps sized to the time you have.`,
    estimatedSuccessPercent: computeSuccessPercent(input),
    timelineDays,
    milestones: [
      {
        title: 'Define the concrete outcome',
        description: 'Write down exactly what success looks like.',
        targetOffsetDays: Math.max(1, Math.round(timelineDays * 0.05)),
      },
      {
        title: 'Build the first habit',
        description: 'Start the smallest recurring action that moves you forward.',
        targetOffsetDays: Math.max(3, Math.round(timelineDays * 0.15)),
      },
      {
        title: 'Hit your first real milestone',
        description: 'The first checkpoint that proves the plan is working.',
        targetOffsetDays: Math.round(timelineDays * 0.5),
      },
      {
        title: 'Review and adjust',
        description: 'Check progress and refine the plan.',
        targetOffsetDays: timelineDays,
      },
    ],
    suggestedMissions: [
      { title: `Daily check-in on "${input.goalTitle}"`, type: 'DAILY', priority: 'HIGH', recurrenceHint: 'Every day' },
      { title: 'Weekly progress review', type: 'WEEKLY', priority: 'MEDIUM', recurrenceHint: 'Every Sunday' },
    ],
    firstWeekMissions,
  };
}
