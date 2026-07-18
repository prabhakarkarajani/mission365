import { create } from 'zustand';

import type { UnlockedAchievement } from '../domain/types';

interface AchievementToastState {
  queue: UnlockedAchievement[];
  push: (achievements: UnlockedAchievement[]) => void;
  shift: () => void;
}

export const useAchievementToastStore = create<AchievementToastState>((set) => ({
  queue: [],
  push: (achievements) =>
    achievements.length > 0 ? set((s) => ({ queue: [...s.queue, ...achievements] })) : undefined,
  shift: () => set((s) => ({ queue: s.queue.slice(1) })),
}));
