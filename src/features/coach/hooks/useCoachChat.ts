import { useMutation } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/application/auth.store';
import { useGoals } from '@/features/goals/application/goal.hooks';
import { useTodayMissions } from '@/features/habits/application/habit.hooks';
import { habitToMission } from '@/features/missions/services/habitMissionMapper';
import type { CoachContext } from '@/ai';

import { useCoachChatStore } from '../application/chat.store';
import { chatWithCoach } from '../services/coach.service';

function useCoachContext(): CoachContext {
  const user = useAuthStore((s) => s.user);
  const { data: goals } = useGoals('active');
  const { data: today } = useTodayMissions();

  return {
    userName: user?.name?.split(' ')[0],
    level: user?.level,
    xp: user?.xp,
    currentStreak: user?.currentStreak,
    goals: (goals ?? []).map((g) => ({
      title: g.title,
      category: g.category,
      currentValue: g.currentValue,
      targetValue: g.targetValue,
      unit: g.unit,
      deadline: g.deadline,
      percentComplete: g.targetValue > 0 ? Math.min(100, (g.currentValue / g.targetValue) * 100) : 0,
    })),
    missions: (today?.missions ?? []).map(({ habit, completed }) => {
      const mission = habitToMission(habit);
      return { title: mission.title, type: mission.type, priority: mission.priority, completed };
    }),
  };
}

export function useCoachChat() {
  const messages = useCoachChatStore((s) => s.messages);
  const addMessage = useCoachChatStore((s) => s.addMessage);
  const clear = useCoachChatStore((s) => s.clear);
  const context = useCoachContext();

  const mutation = useMutation({
    mutationFn: (userText: string) => {
      addMessage({ role: 'user', content: userText });
      const history = [...messages, { role: 'user' as const, content: userText }].map((m) => ({
        role: m.role,
        content: m.content,
      }));
      return chatWithCoach({ messages: history, context });
    },
    onSuccess: (response) => {
      addMessage({ role: 'assistant', content: response.message });
    },
    onError: () => {
      addMessage({
        role: 'assistant',
        content: "Sorry, I couldn't process that. Please try again.",
      });
    },
  });

  return {
    messages,
    sendMessage: mutation.mutate,
    isSending: mutation.isPending,
    clear,
  };
}
