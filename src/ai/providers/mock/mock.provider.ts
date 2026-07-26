import type {
  AIProvider,
  ChatInput,
  ChatResponse,
  CoachContext,
  GeneratedRoadmap,
  RoadmapGenerationInput,
} from '../../core/interfaces/AIProvider';
import type { SuggestedMission } from '@/features/roadmaps/types/roadmap.types';

/**
 * Deterministic, zero-config provider. Used whenever no real vendor is
 * configured so the Coach feature works out of the box without an API key.
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
  const base: SuggestedMission[] = [
    { title: `Define what "${goal}" success looks like`, type: 'ONE_TIME', priority: 'HIGH', dayOffset: 0 },
    { title: `Daily check-in on "${goal}"`, type: 'DAILY', priority: 'HIGH', recurrenceHint: 'Every day', dayOffset: 1 },
    { title: `Daily check-in on "${goal}"`, type: 'DAILY', priority: 'HIGH', recurrenceHint: 'Every day', dayOffset: 2 },
    { title: `Daily check-in on "${goal}"`, type: 'DAILY', priority: 'MEDIUM', recurrenceHint: 'Every day', dayOffset: 3 },
    { title: `Daily check-in on "${goal}"`, type: 'DAILY', priority: 'MEDIUM', recurrenceHint: 'Every day', dayOffset: 4 },
    { title: `Daily check-in on "${goal}"`, type: 'DAILY', priority: 'MEDIUM', recurrenceHint: 'Every day', dayOffset: 5 },
    { title: 'Reflect on your first week and adjust the plan', type: 'ONE_TIME', priority: 'MEDIUM', dayOffset: 6 },
  ];
  return base;
}

function generateMockRoadmap(input: RoadmapGenerationInput): GeneratedRoadmap {
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

const MOTIVATION_LINES = [
  'Small daily actions compound. Show up today and today only — tomorrow takes care of itself.',
  "You don't need more motivation, you need the next tiny step. What's one thing you can finish in the next 10 minutes?",
  "Consistency beats intensity. A short session today keeps the streak — and the momentum — alive.",
  'Progress isn\'t always visible day to day, but it is always adding up. Trust the process.',
];

function pendingMissions(context: CoachContext) {
  return context.missions.filter((m) => !m.completed);
}

function planMyDayReply(context: CoachContext): string {
  const pending = pendingMissions(context);
  const name = context.userName ? `, ${context.userName}` : '';
  if (pending.length === 0) {
    return context.missions.length > 0
      ? `You're all caught up today${name} 🎉 Every mission is done. Want me to suggest something extra toward one of your goals?`
      : `You don't have any missions set up yet${name}. Want to create one, or should I suggest a few based on your goals?`;
  }
  const ordered = [...pending].sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
  const lines = ordered.slice(0, 4).map((m, i) => `${i + 1}. ${m.title} (${m.priority.toLowerCase()} priority)`);
  return [`Here's a plan for today${name}:`, ...lines, ordered.length > 4 ? `…and ${ordered.length - 4} more after that.` : 'That order should give you the best momentum — start at the top.'].join('\n');
}

function priorityRank(priority: string): number {
  const order = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'OPTIONAL'];
  const idx = order.indexOf(priority);
  return idx === -1 ? order.length : idx;
}

function reviewGoalsReply(context: CoachContext): string {
  if (context.goals.length === 0) {
    return "You don't have any active goals yet. Want to create one? I can help build a full roadmap for it.";
  }
  const lines = context.goals.map((g) => {
    const pct = Math.round(g.percentComplete);
    const deadline = g.deadline ? ` · due ${new Date(g.deadline).toLocaleDateString()}` : '';
    return `• ${g.title} — ${pct}% (${g.currentValue}/${g.targetValue}${g.unit ? ` ${g.unit}` : ''})${deadline}`;
  });
  const best = [...context.goals].sort((a, b) => b.percentComplete - a.percentComplete)[0];
  const behind = [...context.goals].sort((a, b) => a.percentComplete - b.percentComplete)[0];
  const callout =
    context.goals.length > 1 && best.title !== behind.title
      ? `\n\n"${best.title}" is your strongest right now. "${behind.title}" could use some attention this week.`
      : '';
  return [`Here's where your goals stand:`, ...lines].join('\n') + callout;
}

function weeklyReviewReply(context: CoachContext): string {
  const pending = pendingMissions(context).length;
  const total = context.missions.length;
  const completed = total - pending;
  const streak = context.currentStreak ?? 0;
  const goalLine =
    context.goals.length > 0
      ? ` Across your ${context.goals.length} active goal${context.goals.length === 1 ? '' : 's'}, average progress is ${Math.round(
          context.goals.reduce((sum, g) => sum + g.percentComplete, 0) / context.goals.length
        )}%.`
      : '';
  return `I don't have a full week crunched here yet, but from what I can see: today you're at ${completed}/${total || 0} missions done, and you're carrying a ${streak}-day streak.${goalLine} Open the Analytics tab for the full weekly breakdown — I'll get live weekly stats soon.`;
}

function motivateReply(context: CoachContext): string {
  const line = MOTIVATION_LINES[Math.floor(Math.random() * MOTIVATION_LINES.length)];
  const streak = context.currentStreak ?? 0;
  const streakLine = streak > 0 ? ` You're already ${streak} day${streak === 1 ? '' : 's'} deep — don't break the chain.` : '';
  return `${line}${streakLine}`;
}

function generateRoadmapReply(context: CoachContext): string {
  if (context.goals.length === 0) {
    return "You don't have an active goal yet, so there's nothing to build a roadmap for. Want to create one? Tap the sparkle button and I'll help shape it into milestones and a first week of missions.";
  }
  const goal = context.goals[0];
  const pct = Math.round(goal.percentComplete);
  const deadline = goal.deadline ? `, due ${new Date(goal.deadline).toLocaleDateString()}` : '';
  return `"${goal.title}" is your current goal, ${pct}% there (${goal.currentValue}/${goal.targetValue}${goal.unit ? ` ${goal.unit}` : ''}${deadline}). Its full milestone roadmap lives on the goal's own page — open it from the Goals tab to see or adjust the path.`;
}

function createGoalReply(): string {
  return "Let's build one together — tap the sparkle button below or say what you're aiming for and I'll help shape it into a plan.";
}

function rescheduleReply(): string {
  return "I can't move missions around from chat just yet — head to the Habits tab, open the mission, and pick a new time. I'll flag this for a future update.";
}

function fallbackReply(context: CoachContext): string {
  const greeting = context.userName ? `Hey ${context.userName}!` : 'Hey!';
  return `${greeting} I'm your AI coach. Ask me to plan your day, review your goals, do a weekly review, or just say "motivate me" when you need a push.`;
}

function generateMockChatReply(input: ChatInput): string {
  const lastUser = [...input.messages].reverse().find((m) => m.role === 'user');
  const text = (lastUser?.content ?? '').toLowerCase();

  if (text.includes('plan my day') || text.includes('plan today') || text.includes('plan for today')) {
    return planMyDayReply(input.context);
  }
  if (text.includes('weekly review') || text.includes('week review') || text.includes('how was my week')) {
    return weeklyReviewReply(input.context);
  }
  if (text.includes('review my goals') || text.includes('review goals') || text.includes('goal progress') || text.includes('my goals')) {
    return reviewGoalsReply(input.context);
  }
  if (text.includes('roadmap')) {
    return generateRoadmapReply(input.context);
  }
  if (text.includes('motivate')) {
    return motivateReply(input.context);
  }
  if (text.includes('reschedule')) {
    return rescheduleReply();
  }
  if (text.includes('create') && text.includes('goal')) {
    return createGoalReply();
  }
  return fallbackReply(input.context);
}

async function mockChat(input: ChatInput): Promise<ChatResponse> {
  return { message: generateMockChatReply(input) };
}

export const mockProvider: AIProvider = {
  name: 'mock',
  generateRoadmap: async (input) => generateMockRoadmap(input),
  chat: mockChat,
};
