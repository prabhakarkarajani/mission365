import { useMutation } from '@tanstack/react-query';

import { sendChatMessage } from '../infrastructure/coach.api';
import { useCoachChatStore } from '../application/chat.store';
import type { Mood } from '../domain/coach.types';

interface SendMessageOptions {
  cardId?: string;
  mood?: Mood;
}

export function useCoachChat() {
  const messages = useCoachChatStore((s) => s.messages);
  const addMessage = useCoachChatStore((s) => s.addMessage);
  const clear = useCoachChatStore((s) => s.clear);

  const mutation = useMutation({
    mutationFn: ({ text, cardId, mood }: { text: string } & SendMessageOptions) => {
      addMessage({ role: 'user', content: text });
      const history = [...messages, { role: 'user' as const, content: text }].map((m) => ({
        role: m.role,
        content: m.content,
      }));
      return sendChatMessage({ messages: history, cardId, mood });
    },
    onSuccess: (response) => {
      addMessage({ role: 'assistant', content: response.reply.content });
    },
    onError: () => {
      addMessage({
        role: 'assistant',
        content: "Sorry, I couldn't process that. Please try again.",
      });
    },
  });

  const sendMessage = (text: string, options?: SendMessageOptions) =>
    mutation.mutate({ text, cardId: options?.cardId, mood: options?.mood });

  return {
    messages,
    sendMessage,
    isSending: mutation.isPending,
    clear,
  };
}
