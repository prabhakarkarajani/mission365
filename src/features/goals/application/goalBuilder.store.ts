import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from '@/shared/lib/zustand-storage';
import type {
  DailyTimeBudget,
  GeneratedRoadmap,
  GoalCurrentLevel,
  PreferredWorkingHours,
} from '@/features/roadmaps/types/roadmap.types';

interface GoalBuilderState {
  selectedCategories: string[];
  goalTitle: string;
  targetDeadline?: string;
  /** Goal Impact weight, 1-5, same scale/default as the manual Goal-creation flow and Goal.importance. */
  importance: number;
  currentLevel: GoalCurrentLevel;
  dailyTimeBudget: DailyTimeBudget;
  preferredWorkingHours: PreferredWorkingHours[];
  challenges: string[];
  roadmap: GeneratedRoadmap | null;
  toggleCategory: (id: string) => void;
  update: (partial: Partial<Omit<GoalBuilderState, 'toggleCategory' | 'update' | 'reset'>>) => void;
  reset: () => void;
}

const initialState = {
  selectedCategories: [] as string[],
  goalTitle: '',
  targetDeadline: undefined as string | undefined,
  importance: 3,
  currentLevel: 'beginner' as GoalCurrentLevel,
  dailyTimeBudget: '30_60' as DailyTimeBudget,
  preferredWorkingHours: [] as PreferredWorkingHours[],
  challenges: [] as string[],
  roadmap: null as GeneratedRoadmap | null,
};

export const useGoalBuilderStore = create<GoalBuilderState>()(
  persist(
    (set) => ({
      ...initialState,
      toggleCategory: (id) =>
        set((s) => ({
          selectedCategories: s.selectedCategories.includes(id)
            ? s.selectedCategories.filter((c) => c !== id)
            : [...s.selectedCategories, id],
        })),
      update: (partial) => set(partial),
      reset: () => set({ ...initialState }),
    }),
    {
      name: 'mission365.goalBuilder',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
