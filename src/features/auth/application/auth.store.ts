import { create } from 'zustand';

import { clearTokens, getTokens, setTokens } from '@/shared/lib/tokens';
import { clearLocalDataIfSynced } from '@/shared/lib/db';

import * as authApi from '../infrastructure/auth.api';
import type { User } from '../domain/types';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: User | null;
  status: AuthStatus;
  error: string | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',
  error: null,

  hydrate: async () => {
    const tokens = getTokens();
    if (!tokens) {
      set({ status: 'unauthenticated' });
      return;
    }

    set({ status: 'loading' });
    try {
      const { user } = await authApi.fetchMe();
      set({ user, status: 'authenticated', error: null });
    } catch {
      clearTokens();
      set({ user: null, status: 'unauthenticated' });
    }
  },

  login: async (email, password) => {
    set({ status: 'loading', error: null });
    try {
      const { user, accessToken, refreshToken } = await authApi.login({ email, password });
      setTokens({ accessToken, refreshToken });
      set({ user, status: 'authenticated' });
    } catch (error) {
      set({ status: 'unauthenticated', error: error instanceof Error ? error.message : 'Login failed' });
      throw error;
    }
  },

  register: async (name, email, password) => {
    set({ status: 'loading', error: null });
    try {
      const { user, accessToken, refreshToken } = await authApi.register({ name, email, password });
      setTokens({ accessToken, refreshToken });
      set({ user, status: 'authenticated' });
    } catch (error) {
      set({ status: 'unauthenticated', error: error instanceof Error ? error.message : 'Registration failed' });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // best-effort server-side revocation; local session clears regardless
    }
    const { runSync } = await import('@/features/habits/infrastructure/habit.sync');
    await runSync().catch(() => {});
    await clearLocalDataIfSynced();
    clearTokens();
    set({ user: null, status: 'unauthenticated', error: null });
  },

  setUser: (user) => set({ user }),

  refreshUser: async () => {
    try {
      const { user } = await authApi.fetchMe();
      set({ user });
    } catch {
      // best-effort background refresh; ignore transient failures
    }
  },
}));
