import { createAIProvider } from '../ai/core/adapters/createAIProvider';
import type { CoachChatResult, CoachMessage } from '../ai/core/interfaces/AIProvider';
import { buildCoachContext } from './coachContext.service';

export interface SendChatMessageInput {
  messages: CoachMessage[];
  cardId?: string;
  mood?: 'great' | 'good' | 'neutral' | 'bad' | 'awful';
}

export async function sendChatMessage(userId: string, input: SendChatMessageInput): Promise<CoachChatResult> {
  const context = await buildCoachContext(userId);
  return createAIProvider().chat({ messages: input.messages, context });
}

export interface SuggestionCard {
  id: string;
  label: string;
  icon: string;
  requiresMoodCheck: boolean;
  prompt: string;
}

/**
 * Static for now - a real endpoint from day one (not a frontend-hardcoded
 * array) so personalizing/reordering later is a response-body change to
 * this function, not a new endpoint requiring an app release.
 */
const SUGGESTION_CARDS: SuggestionCard[] = [
  {
    id: 'plan-day',
    label: 'Plan my day',
    icon: 'sunny-outline',
    requiresMoodCheck: false,
    prompt: 'Help me plan my day using my current missions and goals.',
  },
  {
    id: 'build-roadmap',
    label: 'Build a roadmap',
    icon: 'map-outline',
    requiresMoodCheck: false,
    prompt: 'Help me build a roadmap for one of my goals.',
  },
  {
    id: 'review-progress',
    label: 'Review my progress',
    icon: 'stats-chart-outline',
    requiresMoodCheck: false,
    prompt: 'Review my recent progress across my goals and habits.',
  },
  {
    id: 'stay-consistent',
    label: 'Help me stay consistent',
    icon: 'flame-outline',
    requiresMoodCheck: false,
    prompt: 'Help me stay consistent with my habits and streaks.',
  },
  {
    id: 'feeling-overwhelmed',
    label: "I'm feeling overwhelmed",
    icon: 'heart-outline',
    requiresMoodCheck: true,
    prompt: "I'm feeling overwhelmed right now.",
  },
  {
    id: 'dont-know-start',
    label: "I don't know where to start",
    icon: 'help-circle-outline',
    requiresMoodCheck: true,
    prompt: "I don't know where to start today.",
  },
];

export function getSuggestionCards(): SuggestionCard[] {
  return SUGGESTION_CARDS;
}
