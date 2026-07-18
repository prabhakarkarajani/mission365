import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from '@/shared/lib/zustand-storage';

import type { PlanId } from '../domain/types';

interface SubscriptionState {
  planId: PlanId;
  setPlan: (planId: PlanId) => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      planId: 'free',
      setPlan: (planId) => set({ planId }),
    }),
    {
      name: 'mission365.subscription',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
