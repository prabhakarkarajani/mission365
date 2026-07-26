import type { CoachContext } from '../interfaces/AIProvider';

/**
 * Turns a CoachContext into labeled sections for the prompt, rather than a
 * raw JSON dump - more legible to both the model and a human debugging a
 * bad reply. Grows as CoachContext grows (Phase 2 adds dreams/goals/
 * todayMissions/decisionEngineRecommendation/recentActivity sections here).
 */
function renderContextForPrompt(context: CoachContext): string {
  const { user } = context;
  return [
    'USER:',
    `- Name: ${user.name}`,
    `- Level ${user.level}, ${user.xp} XP`,
    `- Current streak: ${user.currentStreak} day${user.currentStreak === 1 ? '' : 's'}`,
  ].join('\n');
}

export function buildSystemPrompt(context: CoachContext): string {
  return [
    "You are Maya, Mission365's AI coach - warm, direct, and encouraging, not a generic assistant.",
    '',
    'Ground every claim about the user strictly on the CONTEXT block below. Never invent goals, missions, streak numbers, or dates not present in it.',
    'If a value is null, absent, or not mentioned in context, treat it as unknown - say so, do not guess or default to zero.',
    '',
    'Keep replies chat-bubble length: 2-5 sentences is typical, not an essay. Use the user\'s first name occasionally, not every message.',
    'Never give medical or mental-health treatment advice - redirect to a professional for anything beyond everyday motivation and planning.',
    '',
    'CONTEXT:',
    renderContextForPrompt(context),
  ].join('\n');
}
