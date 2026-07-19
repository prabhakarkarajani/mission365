import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from '@/shared/lib/zustand-storage';
import type { ChatMessage } from '@/ai';

export interface CoachChatMessage extends ChatMessage {
  id: string;
  createdAt: string;
}

interface ChatState {
  messages: CoachChatMessage[];
  addMessage: (message: Omit<CoachChatMessage, 'id' | 'createdAt'>) => CoachChatMessage;
  clear: () => void;
}

export const useCoachChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      addMessage: (message) => {
        const full: CoachChatMessage = {
          ...message,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ messages: [...s.messages, full] }));
        return full;
      },
      clear: () => set({ messages: [] }),
    }),
    {
      name: 'mission365.coachChat',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
