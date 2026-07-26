import type { AIProvider, CoachChatInput, CoachChatResult, CoachContext } from '../../core/interfaces/AIProvider';

/**
 * Deterministic, zero-config provider - the CI/test default forever (see
 * backend/src/test/setupEnv.ts), and the fallback when AI_PROVIDER is unset.
 * Keyword-substring matching over the last user message, same idiom the old
 * client-side mock used - a real LLM (the openai provider) doesn't need this
 * kind of per-intent routing, but mock genuinely can't "understand"
 * language, so it stays here only.
 *
 * Replies are intentionally thin in Phase 1, matching CoachContext's
 * current shape (just user profile) - they reference real goals/missions
 * once Phase 2 enriches both the context and this provider's replies.
 */

const MOTIVATION_LINES = [
  'Small daily actions compound. Show up today and today only - tomorrow takes care of itself.',
  "You don't need more motivation, you need the next tiny step. What's one thing you can finish in the next 10 minutes?",
  'Consistency beats intensity. A short session today keeps the streak - and the momentum - alive.',
];

function firstName(context: CoachContext): string {
  return context.user.name.split(' ')[0] ?? context.user.name;
}

function planMyDayReply(context: CoachContext): string {
  return `Hey ${firstName(context)} - I don't have your missions in view yet in this early version, but once that's wired up I'll turn this into a real plan. For now: pick the one thing that would make today feel like a win, and start there.`;
}

function reviewProgressReply(context: CoachContext): string {
  const streak = context.user.currentStreak;
  const streakLine = streak > 0 ? `You're carrying a ${streak}-day streak - ` : '';
  return `${streakLine}You're at level ${context.user.level} with ${context.user.xp} XP so far. Detailed goal-by-goal progress is coming soon - for now, keep the streak alive.`;
}

function motivateReply(context: CoachContext): string {
  const line = MOTIVATION_LINES[Math.floor(Math.random() * MOTIVATION_LINES.length)];
  const streak = context.user.currentStreak;
  const streakLine = streak > 0 ? ` You're already ${streak} day${streak === 1 ? '' : 's'} deep - don't break the chain.` : '';
  return `${line}${streakLine}`;
}

function overwhelmedReply(context: CoachContext): string {
  return `That's okay, ${firstName(context)} - it happens. Take a breath. You don't have to do everything today, just the next small thing. Want to pick one mission to focus on?`;
}

function dontKnowStartReply(): string {
  return "Let's keep it simple: pick the smallest thing you can finish in the next 10 minutes, and start there. Momentum builds from action, not from having the perfect plan.";
}

function roadmapReply(): string {
  return "I can't build a full roadmap in this early version yet, but that's coming soon. In the meantime, break your goal into the smallest next step and start there.";
}

function fallbackReply(context: CoachContext): string {
  return `Hey ${firstName(context)}! I'm still a work in progress, but I'm here. Ask me to plan your day, review your progress, or just say "motivate me" when you need a push.`;
}

function generateMockChatReply(input: CoachChatInput): string {
  const lastUser = [...input.messages].reverse().find((m) => m.role === 'user');
  const text = (lastUser?.content ?? '').toLowerCase();

  if (text.includes('overwhelmed')) return overwhelmedReply(input.context);
  if (text.includes("don't know where to start") || text.includes('dont know where to start')) return dontKnowStartReply();
  if (text.includes('plan my day') || text.includes('plan today') || text.includes('plan for today')) return planMyDayReply(input.context);
  if (text.includes('review') && (text.includes('progress') || text.includes('goals'))) return reviewProgressReply(input.context);
  if (text.includes('roadmap')) return roadmapReply();
  if (text.includes('motivate') || text.includes('consistent')) return motivateReply(input.context);
  return fallbackReply(input.context);
}

async function mockChat(input: CoachChatInput): Promise<CoachChatResult> {
  return { message: generateMockChatReply(input) };
}

export const mockProvider: AIProvider = {
  name: 'mock',
  chat: mockChat,
};
