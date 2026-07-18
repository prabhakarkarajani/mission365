import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';

import { runSync } from '../infrastructure/habit.sync';
import { habitKeys } from './habit.hooks';

export function useHabitSync(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    let mounted = true;

    const syncAndRefresh = async () => {
      await runSync();
      if (mounted) {
        queryClient.invalidateQueries({ queryKey: habitKeys.all });
        queryClient.invalidateQueries({ queryKey: habitKeys.today });
      }
    };

    syncAndRefresh();

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        syncAndRefresh();
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [enabled, queryClient]);
}
