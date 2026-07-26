import { api } from '@/shared/lib/api-client';

import type { ChatReply, ChatRequest, SuggestionCard } from '../domain/coach.types';

export function getSuggestions() {
  return api.get<{ cards: SuggestionCard[] }>('/coach/suggestions');
}

export function sendChatMessage(input: ChatRequest) {
  return api.post<{ reply: ChatReply }>('/coach/chat', input);
}
