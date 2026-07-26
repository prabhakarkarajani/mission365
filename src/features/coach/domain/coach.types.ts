import type { Mood } from '@/features/journal/domain/types';

export type { Mood };

export interface CoachMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SuggestionCard {
  id: string;
  label: string;
  icon: string;
  requiresMoodCheck: boolean;
  prompt: string;
}

export interface ChatRequest {
  messages: CoachMessage[];
  cardId?: string;
  mood?: Mood;
}

export interface ChatReply {
  role: 'assistant';
  content: string;
}
