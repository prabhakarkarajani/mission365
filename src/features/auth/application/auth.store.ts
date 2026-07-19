import { create } from 'zustand';

import { clearTokens, getTokens, setTokens } from '@/shared/lib/tokens';
import { clearLocalDataIfSynced } from '@/shared/lib/db';
import { ApiClientError } from '@/shared/lib/api-client';
import { storage } from '@/shared/lib/storage';

import * as authApi from '../infrastructure/auth.api';
import type { User } from '../domain/types';

const CACHED_USER_KEY = 'auth.cachedUser';

function getCachedUser(): User | null {
  const raw = storage.getString(CACHED_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function setCachedUser(user: User): void {
  storage.set(CACHED_USER_KEY, JSON.stringify(user));
}

function clearCachedUser(): void {
  storage.delete(CACHED_USER_KEY);
}

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
  user: getCachedUser(),
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
      setCachedUser(user);
      set({ user, status: 'authenticated', error: null });
    } catch (error) {
      if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
        clearTokens();
        clearCachedUser();
        set({ user: null, status: 'unauthenticated' });
        return;
      }
      // Network/offline failure at launch — the token itself may still be
      // valid, so keep the session alive rather than logging the user out.
      // `user` falls back to whatever was cached from the last successful
      // fetch; a background refresh fills it in once online again.
      set({ status: 'authenticated' });
    }
  },

  login: async (email, password) => {
    set({ status: 'loading', error: null });
    try {
      const { user, accessToken, refreshToken } = await authApi.login({ email, password });
      setTokens({ accessToken, refreshToken });
      setCachedUser(user);
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
      setCachedUser(user);
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
    clearCachedUser();
    set({ user: null, status: 'unauthenticated', error: null });
  },

  setUser: (user) => {
    setCachedUser(user);
    set({ user });
  },

  refreshUser: async () => {
    try {
      const { user } = await authApi.fetchMe();
      setCachedUser(user);
      set({ user });
    } catch {
      // best-effort background refresh; ignore transient failures
    }
  },
}));
